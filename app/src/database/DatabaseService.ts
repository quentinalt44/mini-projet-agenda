import * as SQLite from 'expo-sqlite';

const API_URL = 'http://your-api-url'; // Replace with your actual API URL

interface Event {
  id?: number;
  title: string;
  summary?: string;
  start_date: string;
  end_date: string;
  created_at?: string;
  isFullDay?: boolean;
  is_full_day?: number;
  category?: string;
}

interface Reminder {
  id?: number;
  event_id: number;
  time: number;
  unit: string;
}

// Définition des catégories d'événements
const EVENT_CATEGORIES = [
  { id: 'default', label: 'Par défaut', color: '#1a73e8' },
  { id: 'work', label: 'Travail', color: '#d50000' },
  { id: 'personal', label: 'Personnel', color: '#33b679' },
  { id: 'family', label: 'Famille', color: '#f6bf26' },
  { id: 'health', label: 'Santé', color: '#8e24aa' },
  { id: 'other', label: 'Autre', color: '#616161' },
];

class DatabaseService {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('calendar.db');
    this.initDatabase();
  }

  private async initDatabase() {
    try {
      // Créez ou ouvrez la base de données
      this.db = await SQLite.openDatabaseAsync('calendar.db');
      
      // Créez la table events avec le champ category
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          summary TEXT,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          is_full_day INTEGER DEFAULT 0,
          category TEXT DEFAULT 'default',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Si la table existe déjà mais n'a pas le champ category, l'ajouter
      try {
        await this.db.execAsync(`
          ALTER TABLE events ADD COLUMN category TEXT DEFAULT 'default';
        `);
      } catch (err) {
        // Si l'erreur est que la colonne existe déjà, c'est ok, sinon relancer l'erreur
        if (!String(err).includes('duplicate column')) {
          throw err;
        }
      }

      // Créez la table reminders
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id INTEGER NOT NULL,
          time INTEGER NOT NULL,
          unit TEXT NOT NULL,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
        );
      `);
      
      console.log("📦 Database initialized");
      
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }

  // Modifier la méthode displayTableContent pour nettoyer les logs et afficher les rappels

  private async displayTableContent() {
    try {
      // 1. Récupérer les événements
      const events = await this.db.getAllAsync<Event>(
        'SELECT * FROM events ORDER BY start_date'
      );

      // 2. Afficher les événements avec un en-tête simple
      console.log('📅 Événements en base de données:');
      console.log('================================');

      if (events && events.length > 0) {
        // Pour chaque événement
        for (const event of events) {
          // Trouver la catégorie pour l'affichage
          const category = EVENT_CATEGORIES.find(cat => cat.id === (event.category || 'default'));
          const categoryLabel = category ? category.label : 'Par défaut';
          
          // Récupérer les rappels associés
          const reminders = await this.getRemindersForEvent(Number(event.id));
          
          // Formater l'affichage principal de l'événement avec un espacement plus propre
          console.log(`
🎯 ID: ${event.id}
📝 Title: ${event.title}
📋 Summary: ${event.summary || 'N/A'}
⏰ Start: ${new Date(event.start_date).toLocaleString('fr-FR')}
🔚 End: ${new Date(event.end_date).toLocaleString('fr-FR')}
📆 Full Day: ${Boolean(event.is_full_day) ? 'Yes' : 'No'}
🏷️ Category: ${categoryLabel}
⏱️ Created: ${event.created_at}`);
          
          // Afficher les rappels associés, s'il y en a
          if (reminders.length > 0) {
            console.log(`🔔 Rappels (${reminders.length}):`);
            reminders.forEach(reminder => {
              const unitLabel = reminder.unit === 'minute' ? 'minute(s)' : 
                             reminder.unit === 'hour' ? 'heure(s)' : 'jour(s)';
              console.log(`   - ${reminder.time} ${unitLabel} avant`);
            });
          } else {
            console.log('🔔 Aucun rappel configuré');
          }
          
          console.log('--------------------------------');
        }
      } else {
        console.log('Aucun événement dans la base de données');
      }
      console.log('================================\n');

    } catch (error) {
      console.error('Erreur lors de l\'affichage du contenu de la table:', error);
    }
  }

  async addEvent(event: any): Promise<any> {
    console.log('Adding event with full day:', event.isFullDay); // Pour debug
    try {
      await this.db.runAsync(
        'INSERT INTO events (title, summary, start_date, end_date, is_full_day, category) VALUES (?, ?, ?, ?, ?, ?)',
        [event.title, event.summary, event.start_date, event.end_date, event.isFullDay ? 1 : 0, event.category]
      );
      
      // Get the last inserted ID
      const result = await this.db.getAllAsync<{ id: number }>(
        'SELECT last_insert_rowid() as id'
      );
      const eventId = result[0]?.id;
      
      // Ajouter les rappels si présents
      if (event.reminders && event.reminders.length > 0) {
        console.log(`Adding ${event.reminders.length} reminders for event ${eventId}`);
        for (const reminder of event.reminders) {
          await this.addReminder(eventId, reminder);
        }
      }
      
      console.log('✅ Event added successfully');
      await this.displayTableContent();
      return { id: eventId, ...event };
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  }
  
  async addReminder(eventId: number, reminder: Reminder): Promise<any> {
    try {
      await this.db.runAsync(
        'INSERT INTO reminders (event_id, time, unit) VALUES (?, ?, ?)',
        [eventId, reminder.time, reminder.unit]
      );
      
      // Get the last inserted ID
      const result = await this.db.getAllAsync<{ id: number }>(
        'SELECT last_insert_rowid() as id'
      );
      const reminderId = result[0]?.id;
      return { id: reminderId, eventId, ...reminder };
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }

  async getRemindersForEvent(eventId: number): Promise<Reminder[]> {
    try {
      const reminders = await this.db.getAllAsync<Reminder>(
        'SELECT * FROM reminders WHERE event_id = ?',
        [eventId]
      );
      return reminders;
    } catch (error) {
      console.error('Error getting reminders for event:', error);
      return [];
    }
  }

  async deleteReminder(reminderId: number): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM reminders WHERE id = ?', [reminderId]);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  async getEvents(): Promise<Event[]> {
    try {
      const events = await this.db.getAllAsync<Event>(
        'SELECT id, title, summary, start_date, end_date, is_full_day, created_at, category FROM events ORDER BY start_date'
      );
      
      // Transformation des événements avec leurs rappels
      const eventsWithReminders = await Promise.all(events.map(async event => {
        // Récupérer les rappels pour cet événement
        const reminders = await this.getRemindersForEvent(Number(event.id));
        
        return {
          id: event.id,
          title: event.title,
          summary: event.summary,
          start: event.start_date,
          end: event.end_date,
          start_date: event.start_date,
          end_date: event.end_date,
          isFullDay: event.is_full_day === 1, // Conversion explicite et stricte
          created_at: event.created_at,
          category: event.category || 'default',
          reminders: reminders // Ajout des rappels
        };
      }));
      
      return eventsWithReminders;
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  async updateEvent(id: string, event: { title: string; summary?: string; start: string; end: string; isFullDay?: boolean; category?: string; reminders?: Reminder[] }): Promise<void> {
    try {
      console.log("⚙️ Mise à jour de l'événement :", id);
      console.log("📊 Données :", {
        title: event.title,
        summary: event.summary,
        isFullDay: event.isFullDay,
        category: event.category,
        reminders: event.reminders?.length || 0
      });
      
      // Pour les événements fullday, reformater les dates pour s'assurer qu'elles sont 00:00 et 23:59
      let startDate = event.start;
      let endDate = event.end;
      
      if (event.isFullDay) {
        // Reformater les dates pour les événements fullday
        const startDateParts = event.start.split('T')[0];
        const endDateParts = event.end.split('T')[0];
        
        startDate = `${startDateParts}T00:00:00`;
        endDate = `${endDateParts}T23:59:00`;
        
        console.log("📅 Dates reformatées pour fullday :");
        console.log("   - Début :", startDate);
        console.log("   - Fin :", endDate);
      }
      
      await this.db.runAsync(
        'UPDATE events SET title = ?, summary = ?, start_date = ?, end_date = ?, is_full_day = ?, category = ? WHERE id = ?',
        [event.title, event.summary || null, startDate, endDate, event.isFullDay ? 1 : 0, event.category || 'default', id]
      );
      
      // Gestion des rappels lors de la mise à jour
      if (event.reminders !== undefined) {
        // 1. Supprimer tous les rappels existants
        await this.db.runAsync('DELETE FROM reminders WHERE event_id = ?', [id]);
        
        // 2. Ajouter les nouveaux rappels
        if (event.reminders && event.reminders.length > 0) {
          console.log(`Updating ${event.reminders.length} reminders for event ${id}`);
          for (const reminder of event.reminders) {
            await this.addReminder(Number(id), reminder);
          }
        }
      }
      
      console.log("✅ Événement mis à jour avec succès");
      await this.displayTableContent();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'événement:', error);
      throw error;
    }
  }

  async deleteEvent(id: number): Promise<void> {
    try {
      await this.db.runAsync(
        'DELETE FROM events WHERE id = ?',
        [id]
      );
      console.log(`🗑️ Event ${id} deleted successfully`);
      await this.displayTableContent();
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
export { EVENT_CATEGORIES };