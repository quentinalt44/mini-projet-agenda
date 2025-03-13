import * as SQLite from 'expo-sqlite';

const API_URL = 'http://your-api-url'; // Replace with your actual API URL

interface Event {
  id?: number;
  title: string;
  summary?: string;
  start_date: string;
  end_date: string;
  created_at?: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('calendar.db');
    this.initDatabase();
  }

  private async initDatabase() {
    try {
      await this.db.runAsync(
        `CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          summary TEXT,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
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
    try {
      await this.db.runAsync(
        'INSERT INTO events (title, summary, start_date, end_date) VALUES (?, ?, ?, ?)',
        [event.title, event.summary || null, event.start_date, event.end_date]
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
      const result = await this.db.getAllAsync<Event>(
        'SELECT * FROM events ORDER BY start_date'
      );
      return result || [];
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  }

  async updateEvent(id: string, event: { title: string; summary?: string; start: string; end: string }): Promise<void> {
    try {
      await this.db.runAsync(
        'UPDATE events SET title = ?, summary = ?, start_date = ?, end_date = ? WHERE id = ?',
        [event.title, event.summary || null, event.start, event.end, id]
      );
      console.log(`✏️ Event ${id} updated successfully`);
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