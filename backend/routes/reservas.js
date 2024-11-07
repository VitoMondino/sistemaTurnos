const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener empleados
router.get('/empleados', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM empleados');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    next(error);
  }
});

// Verificar disponibilidad
router.get('/disponibilidad', async (req, res, next) => {
  const { fecha, empleado_id } = req.query;
  try {
    const [reservas] = await db.query(
      'SELECT hora FROM reservas WHERE fecha = ? AND empleado_id = ?',
      [fecha, empleado_id]
    );
    
    const horasOcupadas = reservas.map(reserva => reserva.hora);
    const horasDisponibles = generarHorasDisponibles(horasOcupadas);
    
    res.json({ horasDisponibles });
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    next(error);
  }
});

// Registrar reserva
router.post('/', async (req, res, next) => {
  const { cliente_nombre, empleado_id, fecha, hora } = req.body;
  try {
    console.log('Datos recibidos:', { cliente_nombre, empleado_id, fecha, hora });
    
    if (!cliente_nombre || !empleado_id || !fecha || !hora) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    // Verificar si ya existe una reserva para ese empleado en esa fecha y hora
    const [existingReservas] = await db.query(
      'SELECT * FROM reservas WHERE empleado_id = ? AND fecha = ? AND hora = ?',
      [empleado_id, fecha, hora]
    );

    if (existingReservas.length > 0) {
      return res.status(409).json({ message: 'El horario seleccionado ya está ocupado' });
    }

    const [result] = await db.query(
      'INSERT INTO reservas (cliente_nombre, empleado_id, fecha, hora) VALUES (?, ?, ?, ?)',
      [cliente_nombre, empleado_id, fecha, hora]
    );
    res.status(201).json({ message: 'Reserva registrada', id: result.insertId });
  } catch (error) {
    console.error('Error al registrar reserva:', error);
    next(error);
  }
});

// Obtener todas las reservas
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT r.id, r.cliente_nombre, r.fecha, r.hora, e.nombre AS empleado_nombre
      FROM reservas r
      JOIN empleados e ON r.empleado_id = e.id
      ORDER BY r.fecha, r.hora
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    next(error);
  }
});

// Cancelar reserva
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM reservas WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    res.json({ message: 'Reserva cancelada con éxito' });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    next(error);
  }
});

function generarHorasDisponibles(horasOcupadas) {
  const horaInicio1 = 8 * 60; // 8:00 AM en minutos
  const horaFin1 = 13 * 60; // 1:00 PM en minutos
  const horaInicio2 = 16 * 60; // 4:00 PM en minutos
  const horaFin2 = 21 * 60; // 9:00 PM en minutos
  const intervalo = 20; // 20 minutos

  let horasDisponibles = [];

  for (let minutos = horaInicio1; minutos < horaFin1; minutos += intervalo) {
    const hora = `${Math.floor(minutos / 60).toString().padStart(2, '0')}:${(minutos % 60).toString().padStart(2, '0')}`;
    if (!horasOcupadas.includes(hora)) {
      horasDisponibles.push(hora);
    }
  }

  for (let minutos = horaInicio2; minutos < horaFin2; minutos += intervalo) {
    const hora = `${Math.floor(minutos / 60).toString().padStart(2, '0')}:${(minutos % 60).toString().padStart(2, '0')}`;
    if (!horasOcupadas.includes(hora)) {
      horasDisponibles.push(hora);
    }
  }

  return horasDisponibles;
}

module.exports = router;