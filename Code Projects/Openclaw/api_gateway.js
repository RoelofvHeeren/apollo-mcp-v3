const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
// Serve Dashboard Statically
app.use(express.static(path.join(__dirname, 'elvison-web-dashboard')));

const PORT = 8080; // Unified port for Caddy/Dashboard
const OPENCLAW_API = process.env.OPENCLAW_API || 'http://127.0.0.1:18789'; // Real OpenClaw Gateway
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o'; // Decoupled

// OpenRouter Neural Proxy
const neuralCompletion = async (prompt, systemRole = "You are a strategic AI agent in the Elvison Mission Control Hub.", modelOverride = null) => {
    if (!OPENROUTER_KEY) return { error: "Neural link offline (API key missing)" };
    
    const targetModel = modelOverride || OPENROUTER_MODEL;
    console.log(`Neural Proxy: Routing to ${targetModel}`);

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: targetModel,
            messages: [
                { role: "system", content: systemRole },
                { role: "user", content: prompt }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_KEY}`,
                'HTTP-Referer': `http://localhost:${PORT}`,
                'X-OpenRouter-Title': 'Elvison Mission Control'
            }
        });
        return response.data;
    } catch (err) {
        console.error("Neural Error:", err.response?.data || err.message);
        throw err;
    }
};

// Helper to register routes with and without /api prefix
const registerRoute = (routePath, method, handler) => {
    app[method](routePath, handler);
    app[method](`/api${routePath}`, handler);
};

// --- DATA ACCESS ENDPOINTS ---

// Dashboard Metrics (Real or Mocked)
registerRoute('/dashboard/metrics', 'get', (req, res) => {
    // In a real scenario, this would aggregate data from OpenClaw and VPS monitoring
    res.json({
        tasks: { completed: 24, active: 8, scheduled: 12 },
        api_cost: "$12.45",
        errors: 2,
        system_health: "NOMINAL",
        cpu_usage: "12%",
        mem_usage: "450MB"
    });
});

// Reports (Full System, Project, Agent)
registerRoute('/dashboard/reports', 'get', (req, res) => {
    const { type, id } = req.query;
    res.json({
        report_type: type || 'System',
        target_id: id || 'Global',
        summary: "Weekly performance is up by 15%. Agent 'pm' completed 12 tasks.",
        data: [ { date: "2026-03-17", value: 85 }, { date: "2026-03-16", value: 78 } ]
    });
});

// --- STRATEGIC ENGINE ENDPOINTS ---

// AI Intelligence Hub (Live activity scan)
registerRoute('/intelligence', 'get', (req, res) => {
    // Attempting to read local system_intelligence.json or a log file
    const intelPath = path.join(__dirname, 'system_intelligence.json');
    const logPath = path.join(__dirname, 'agent_activity.log');

    if (fs.existsSync(intelPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(intelPath, 'utf8'));
            return res.json(data);
        } catch (e) {
            return res.status(500).json({ error: "Failed to parse intelligence data" });
        }
    } else if (fs.existsSync(logPath)) {
        const logs = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean).slice(-10);
        res.json({
            status: "ACTIVE",
            recent_logs: logs.map(l => ({ agent: "LOG", status: l }))
        });
    } else {
        res.json({ status: "IDLE", recent_logs: [{ agent: "SYSTEM", status: "Waiting for activity... (Create agent_activity.log to see live logs)" }] });
    }
});

// --- CORE COMMAND ENDPOINTS ---
registerRoute('/shell', 'post', (req, res) => {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'No command provided' });

    // Sanitize or restrict commands here in a production environment
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
        res.json({
            output: (stdout || '') + (stderr || ''),
            error: error ? error.message : null
        });
    });
});

// AI Architect / Meta-Dev Endpoint
registerRoute('/meta-dev', 'post', async (req, res) => {
    const { prompt } = req.body;
    const logEntry = `[${new Date().toISOString()}] PROMPT: ${prompt}\n`;
    
    console.log(`AI Architect received prompt: ${prompt}`);
    
    // Append to a specific architect task log for the "Shadow Architect" to read
    try {
        fs.appendFileSync(path.join(__dirname, 'architect_tasks.log'), logEntry);
    } catch (err) {
        console.error("Failed to write to architect_tasks.log", err);
    }

    try {
        const data = await neuralCompletion(prompt, "You are Antigravity, the Strategic AI Architect of OpenClaw. You optimize codebases, VPS infrastructure, and neural nodes.", req.body.model);
        res.json({
            response: data.choices?.[0]?.message?.content || "Connection stable, but response incomplete.",
            status: "neural-computed",
            model: req.body.model || OPENROUTER_MODEL
        });
    } catch (error) {
        res.status(500).json({ error: 'Neuromorphic link failure', details: error.message });
    }
});

// Agent Direct Proxy
registerRoute('/prompt', 'post', async (req, res) => {
    const { prompt, agent, model, realAgent } = req.body;
    try {
        // If realAgent is explicitly true, or if OpenRouter key is missing, talk to real OpenClaw
        if (realAgent || !OPENROUTER_KEY) {
            console.log(`OpenClaw Bridge: Routing to Real Agent ${agent || 'pm'}`);
            // Use the Gateway's execute/prompt API
            const response = await axios.post(`${OPENCLAW_API}/prompt`, {
                prompt,
                agent: agent || 'pm',
                stream: false
            });
            return res.json(response.data);
        }

        const data = await neuralCompletion(prompt, `You are Elvison Agent ${agent || 'Nexus-01'}, a strategic operative in the Mission Control Hub.`, model);
        return res.json({ 
            response: data.choices?.[0]?.message?.content || "Neural link stable. Command indexed.",
            model: model || OPENROUTER_MODEL 
        });
    } catch (error) {
        res.status(500).json({ error: 'Strategic link unreachable', details: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`OpenClaw Gateway active on port ${PORT}`);
});
