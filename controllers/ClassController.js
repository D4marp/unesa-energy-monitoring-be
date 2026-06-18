const Class = require('../models/Class');

class ClassController {
  static async getAll(req, res) {
    try {
      const classes = await Class.getAll();
      res.json({
        success: true,
        data: classes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const classData = await Class.getById(id);

      if (!classData) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      res.json({
        success: true,
        data: classData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async create(req, res) {
    try {
      const { name, description, location, building, floor, area, capacity } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Name is required'
        });
      }

      const result = await Class.create({
        name,
        description,
        location,
        building,
        floor,
        area,
        capacity
      });

      res.status(201).json({
        success: true,
        message: 'Class created successfully',
        data: {
          id: result.insertId,
          name,
          description,
          location,
          building,
          floor,
          area,
          capacity
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, location, building, floor, area, capacity, status } = req.body;

      const classExists = await Class.getById(id);
      if (!classExists) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      await Class.update(id, {
        name,
        description,
        location,
        building,
        floor,
        area,
        capacity,
        status
      });

      res.json({
        success: true,
        message: 'Class updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      const classExists = await Class.getById(id);
      if (!classExists) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      await Class.delete(id);

      res.json({
        success: true,
        message: 'Class deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ClassController;
