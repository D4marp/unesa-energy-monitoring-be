const db = require('../config/database');

class Class {
  static async getAll() {
    try {
      const [rows] = await db.query('SELECT * FROM classes WHERE status = "active" ORDER BY name');
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await db.query('SELECT * FROM classes WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async create(data) {
    try {
      const { name, description, location, building, floor, area, capacity } = data;
      const [result] = await db.query(
        'INSERT INTO classes (name, description, location, building, floor, area, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description, location, building, floor, area, capacity]
      );
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async update(id, data) {
    try {
      const { name, description, location, building, floor, area, capacity, status } = data;
      const [result] = await db.query(
        'UPDATE classes SET name = ?, description = ?, location = ?, building = ?, floor = ?, area = ?, capacity = ?, status = ? WHERE id = ?',
        [name, description, location, building, floor, area, capacity, status, id]
      );
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM classes WHERE id = ?', [id]);
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

module.exports = Class;
