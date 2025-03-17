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
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('calendar.db');
    this.initDatabase();
  }

  private async initDatabase() {
    try {
      // Supprimer la table si elle existe
      await this.db.runAsync('DROP TABLE IF EXISTS events');
      
      // Créer la table avec la nouvelle structure
      await this.db.runAsync(
        `CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          summary TEXT,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          is_full_day INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );
      console.log('📦 Database initialized');
      await this.displayTableContent();
    } catch (error) {
      console.error('Error initializing database:', error);
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
          console.log(`
              🎯 ID: ${event.id}
              📝 Title: ${event.title}
              📋 Summary: ${event.summary || 'N/A'}
              ⏰ Start: ${new Date(event.start_date).toLocaleString()}
              🔚 End: ${new Date(event.end_date).toLocaleString()}
              📆 Full Day: ${Boolean(event.is_full_day) ? 'Yes' : 'No'}
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
        'INSERT INTO events (title, summary, start_date, end_date, is_full_day) VALUES (?, ?, ?, ?, ?)',
        [event.title, event.summary || null, event.start_date, event.end_date, event.isFullDay ? 1 : 0]
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
        'SELECT id, title, summary, start_date, end_date, is_full_day, created_at FROM events ORDER BY start_date'
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
          created_at: event.created_at
        };
      });
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  async updateEvent(id: string, event: { title: string; summary?: string; start: string; end: string; isFullDay?: boolean }): Promise<void> {
    console.log("Updating event with isFullDay:", event.isFullDay); // Debug log
    try {
      await this.db.runAsync(
        'UPDATE events SET title = ?, summary = ?, start_date = ?, end_date = ?, is_full_day = ? WHERE id = ?',
        [event.title, event.summary || null, event.start, event.end, event.isFullDay ? 1 : 0, id]
      );
      console.log('✅ Event updated successfully');
      await this.displayTableContent();
    } catch (error) {
      console.error('Error updating event:', error);
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