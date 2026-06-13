const express = require('express');
const router = express.Router();
const si = require('systeminformation');
const os = require('os');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [cpu, mem, disk, network, time] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.time()
    ]);

    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    res.json({
      cpu: {
        usage: Math.round(cpu.currentLoad * 100) / 100,
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'N/A'
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        usagePercent: Math.round((mem.used / mem.total) * 100 * 100) / 100
      },
      disk: disk.map(d => ({
        mount: d.mount,
        type: d.type,
        size: d.size,
        used: d.used,
        available: d.available,
        usagePercent: d.use
      })),
      network: network.map(n => ({
        iface: n.iface,
        rx_bytes: n.rx_bytes,
        tx_bytes: n.tx_bytes,
        rx_sec: n.rx_sec,
        tx_sec: n.tx_sec
      })),
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: `${days}d ${hours}h ${minutes}m`,
        nodeVersion: process.version
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter estatísticas: ' + err.message });
  }
});

// GET /api/dashboard/processes
router.get('/processes', authenticate, async (req, res) => {
  try {
    const processes = await si.processes();
    const topProcesses = processes.list
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 20)
      .map(p => ({
        pid: p.pid,
        name: p.name,
        cpu: Math.round(p.cpu * 100) / 100,
        mem: Math.round(p.mem * 100) / 100,
        state: p.state
      }));

    res.json({ processes: topProcesses, total: processes.all });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter processos: ' + err.message });
  }
});

module.exports = router;
