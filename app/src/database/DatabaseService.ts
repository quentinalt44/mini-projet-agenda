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
      
      console.log("📦 Database initialized");
      
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }

  private async displayTableContent() {
    try {
      const result = await this.db.getAllAsync<Event>(
        'SELECT * FROM events ORDER BY start_date'
      );
      console.log('📅 Current Events in Database:');
      console.log('================================');
      if (result && result.length > 0) {
        result.forEach(event => {
          // Trouver la catégorie pour l'affichage
          const category = EVENT_CATEGORIES.find(cat => cat.id === (event.category || 'default'));
          const categoryLabel = category ? category.label : 'Par défaut';
          
          console.log(`
              🎯 ID: ${event.id}
              📝 Title: ${event.title}
              📋 Summary: ${event.summary || 'N/A'}
              ⏰ Start: ${new Date(event.start_date).toLocaleString()}
              🔚 End: ${new Date(event.end_date).toLocaleString()}
              📆 Full Day: ${Boolean(event.is_full_day) ? 'Yes' : 'No'}
              🏷️ Category: ${categoryLabel}
              ⏱️ Created: ${event.created_at}
              --------------------------------`);
        });
      } else {
        console.log('No events in database');
      }
      console.log('================================\n');
    } catch (error) {
      console.error('Error displaying table content:', error);
    }
  }

  async addEvent(event: Omit<Event, 'id' | 'created_at'>): Promise<void> {
    console.log('Adding event with full day:', event.isFullDay); // Pour debug
    try {
      await this.db.runAsync(
        'INSERT INTO events (title, summary, start_date, end_date, is_full_day, category) VALUES (?, ?, ?, ?, ?, ?)',
        [event.title, event.summary || null, event.start_date, event.end_date, event.isFullDay ? 1 : 0, event.category || 'default']
      );
      console.log('✅ Event added successfully');
      await this.displayTableContent();
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  }

  async getEvents(): Promise<Event[]> {
    try {
      const events = await this.db.getAllAsync<Event>(
        'SELECT id, title, summary, start_date, end_date, is_full_day, created_at, category FROM events ORDER BY start_date'
      );
      return events.map(event => {
        console.log("Event from DB:", event.id, "is_full_day:", event.is_full_day); // Debug log
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
          category: event.category || 'default' // Ajout de la catégorie
        };
      });
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  async updateEvent(id: string, event: { title: string; summary?: string; start: string; end: string; isFullDay?: boolean; category?: string }): Promise<void> {
    try {
      console.log("⚙️ Mise à jour de l'événement :", id);
      console.log("📊 Données :", {
        title: event.title,
        summary: event.summary,
        isFullDay: event.isFullDay,
        category: event.category
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

// Définition des catégories d'événements
const EVENT_CATEGORIES = [
  { id: 'default', label: 'Par défaut', color: '#1a73e8' },
  { id: 'work', label: 'Travail', color: '#d50000' },
  { id: 'personal', label: 'Personnel', color: '#33b679' },
  { id: 'family', label: 'Famille', color: '#f6bf26' },
  { id: 'health', label: 'Santé', color: '#8e24aa' },
  { id: 'other', label: 'Autre', color: '#616161' },
];

// Dans la fonction getAllEvents ou dans la fonction qui affiche les logs

// Si vous avez une fonction qui génère les logs comme celle-ci:
const logEvents = async () => {
  try {
    const events = await databaseService.getEvents();
    console.log("📅 Current Events in Database:");
    console.log("================================");
    
    if (events.length === 0) {
      console.log("No events in database");
    } else {
      events.forEach(event => {
        // Trouver la catégorie pour l'affichage
        const category = EVENT_CATEGORIES.find(cat => cat.id === (event.category || 'default'));
        const categoryLabel = category ? category.label : 'Par défaut';
        
        console.log(`
              🎯 ID: ${event.id}
              📝 Title: ${event.title}
              📋 Summary: ${event.summary || 'N/A'}
              ⏰ Start: ${new Date(event.start_date).toLocaleString()}
              🔚 End: ${new Date(event.end_date).toLocaleString()}
              📆 Full Day: ${event.isFullDay ? 'Yes' : 'No'}
              🏷️ Category: ${categoryLabel}
              ⏱️ Created: ${event.created_at}
              --------------------------------`);
      });
    }
    
    console.log("================================");
  } catch (error) {
    console.error("Error logging events:", error);
  }
};