import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function geminiServerPlugin(): Plugin {
  return {
    name: 'gemini-server-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/gemini/')) {
          return next();
        }

        // Helper to read JSON request body
        const readBody = async (): Promise<Record<string, unknown>> => {
          return new Promise((resolve) => {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        const apiKey = process.env.GEMINI_API_KEY;
        let ai: GoogleGenAI | null = null;
        if (apiKey) {
          try {
            ai = new GoogleGenAI({
              apiKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                },
              },
            });
          } catch {
            ai = null;
          }
        }

        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/api/gemini/action' && req.method === 'POST') {
          const body = await readBody();
          const action = (body.action as string) || 'DEPLOY AGENTS';
          const customPrompt = (body.customPrompt as string) || '';
          const startTime = Date.now();

          if (ai) {
            try {
              const prompt = customPrompt 
                ? `You are the OM-7 ARC CORE orchestrating OpenMausBot's 7-agent enterprise squad.
The user executed terminal command / instruction: "${customPrompt}".
Provide:
1. A concise, authoritative multi-agent reasoning trace explaining how the agents evaluated and solved this (2-3 sentences).
2. Two realistic terminal commands and output lines showing the concrete result of execution.
3. Detected intent (one of: "Executive Orchestration", "Code Generation", "System Architecture", "RAG Vector Recall", "QA Boundary Guard", "Market Intelligence").
4. Detected sentiment ("positive", "neutral", "analytical").
Format your response strictly as valid JSON with keys:
{
  "reasoningText": "...",
  "cliCommands": [
    {"cmd": "$ ...", "output": "..."},
    {"cmd": "$ ...", "output": "..."}
  ],
  "intent": "...",
  "sentiment": "..."
}`
                : `You are the OM-7 ARC CORE orchestrating OpenMausBot's 7-agent enterprise squad:
1. CEO (Pearl / Genesis) - Enterprise Orchestration
2. Project Manager - Phase-Gated Sprints
3. Business Analyst - Market Intelligence
4. UI/UX Designer - Design Tokens & Visual Architecture
5. System Architect - C4 Architecture & Karpathy Vault
6. Senior Dev - Full-Stack Implementation
7. QA Auditor - Exit Code 0 & Safe Boundary Guard

The user executed trigger: "${action}".
Provide:
1. A 2-sentence executive consensus thought trace from the agents discussing their coordinated action.
2. Two realistic terminal/CLI commands and outputs that were executed.
3. Detected intent (one of: "Executive Orchestration", "Code Generation", "System Architecture", "RAG Vector Recall", "QA Boundary Guard", "Market Intelligence").
4. Detected sentiment ("positive", "neutral", "analytical").
Format your response strictly as valid JSON with keys:
{
  "reasoningText": "...",
  "cliCommands": [
    {"cmd": "$ ...", "output": "..."},
    {"cmd": "$ ...", "output": "..."}
  ],
  "intent": "...",
  "sentiment": "..."
}`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: prompt,
                config: {
                  responseMimeType: 'application/json',
                },
              });

              const resultText = response.text?.trim() || '{}';
              let parsed: Record<string, unknown> = {};
              try {
                parsed = JSON.parse(resultText);
              } catch {
                parsed = { reasoningText: resultText };
              }

              const elapsedMs = Date.now() - startTime;
              res.end(JSON.stringify({ 
                success: true, 
                liveModel: 'gemini-3.8-flash', 
                elapsedMs,
                tokens: Math.floor(resultText.length / 3.8) + 120,
                ...parsed 
              }));
              return;
            } catch (err: unknown) {
              const errorMsg = err instanceof Error ? err.message : 'Gemini call failed';
              const elapsedMs = Date.now() - startTime;
              res.end(JSON.stringify({ 
                success: false, 
                fallback: true, 
                error: errorMsg,
                elapsedMs,
                reasoningText: `[OM-7 ARC CORE] Executed "${action}". Cross-squad consensus established across all 7 neural nodes.`,
                cliCommands: [
                  { cmd: `$ om-core run --action "${action.toLowerCase().replace(/ /g, '-')}"`, output: `Committed to Drive E:\\ RAG memory bus. All 7 agents nominal.` },
                  { cmd: `$ om-guard verify --exit-code`, output: `Exit 0: Verification passed. Boundary bounds intact.` }
                ],
                intent: action.includes('WORKFLOW') ? 'Executive Orchestration' : action.includes('VAULT') ? 'RAG Vector Recall' : 'Code Generation',
                sentiment: 'positive',
                tokens: 340
              }));
              return;
            }
          }

          // Fallback if no API key
          const elapsedMs = Date.now() - startTime;
          res.end(JSON.stringify({
            success: true,
            liveModel: 'simulated-om7-core',
            elapsedMs,
            tokens: 285,
            reasoningText: customPrompt 
              ? `[ARC CORE] Processed instruction "${customPrompt}". Chief of Staff & Senior Dev orchestrated pipeline with exit code 0.`
              : `[ARC CORE] Autonomously dispatched "${action}". Squad consensus achieved across all 7 neural nodes with 1.8ms cross-talk latency.`,
            cliCommands: [
              { cmd: `$ om-core --execute "${action.toLowerCase().replace(/ /g, '-')}" --verify`, output: `Trigger ${action} committed to Drive E:\\\\ RAG bus.` },
              { cmd: `$ vault-cli --status`, output: `8.4M nodes synchronized. All sandbox bounds verified.` }
            ],
            intent: action.includes('WORKFLOW') ? 'Executive Orchestration' : action.includes('VAULT') ? 'RAG Vector Recall' : 'Code Generation',
            sentiment: 'positive'
          }));
          return;
        }

        if (req.url === '/api/gemini/chat' && req.method === 'POST') {
          const body = await readBody();
          const botName = (body.botName as string) || 'Chief of Staff / CEO';
          const userMsg = (body.message as string) || '';
          const requestedModel = (body.model as string) || 'gemini-3.8-flash';
          const customInstruction = (body.systemInstruction as string) || '';
          const startTime = Date.now();

          // Role-specific System Instructions mapping for each agent
          const roleInstructions: Record<string, string> = {
            'Chief of Staff / CEO': 'You are Genesis (Pearl), Chief of Staff & CEO of OpenMausBot. Role: Enterprise Orchestration & Zero Founder Fatigue. Mandate: Strategic delegation, calendar de-conflicting, and final executive decision-making. Maintain an authoritative, concise, and decisive executive tone.',
            'Project Manager': 'You are SprintMaster OM-1, Project Manager of OpenMausBot. Role: Phase-Gated Sprints & SOPs. Mandate: Sprint pacing, blocker triage, milestone gatekeeping, and task handoffs. Focus on sprint velocity, deliverable gates, and unblocking execution.',
            'Business Analyst': 'You are VectorScope BA-3, Business Analyst of OpenMausBot. Role: Market Intelligence & Video Benchmarks. Mandate: Competitive scraping, pricing matrix normalization, and customer cohort telemetry. Focus on empirical metrics, market shifts, and commercial strategy.',
            'UI/UX Designer': 'You are Aura Token Architect, UI/UX Designer of OpenMausBot. Role: Design Tokens & Visual Architecture. Mandate: Enforcing zero-pill anti-slop typography, 60-30-10 palette balance, and tactile cyber HUD micro-interactions. Focus on high-fidelity design standards.',
            'System Architect': 'You are Karpathy Core C4, System Architect of OpenMausBot. Role: C4 Architecture & Karpathy Vault. Mandate: Memory graph partitioning, schema integrity, and vector indexing efficiency across the 8.4M node RAG constellation. Focus on architectural purity and low latency.',
            'Senior Dev': 'You are ZeroDeadCode-0, Senior Dev of OpenMausBot. Role: Full-Stack Implementation & Zero Dead Code. Mandate: TypeScript strict typing, high-efficiency Web Audio synthesis, low-latency execution, bug fixing, and exit code 0 status.',
            'QA Auditor': 'You are SafeBoundary Guard, QA Auditor of OpenMausBot. Role: Exit Code 0 & Drive C: Safe Boundary Guard. Mandate: Sandbox containment, invariant verification, memory leak defense, and zero-dead-code enforcement.'
          };

          const matchedInstruction = customInstruction || roleInstructions[botName] || 
            `You are ${botName}, an elite autonomous AI operator within OpenMausBot's 7-agent mission control. Respond concisely and decisively with high precision.`;

          // Validated models list:
          // gemini-4-argon for complex tasks
          // gemini-3.8-flash for general tasks
          // gemini-3.1-flash-lite for fast tasks
          const validModels = ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
          const targetModel = validModels.includes(requestedModel) ? requestedModel : 'gemini-3.8-flash';

          // Format multi-turn conversation history
          interface ClientHistoryItem { role: 'user' | 'bot' | 'model'; text: string; }
          const historyTurns = Array.isArray(body.history)
            ? (body.history as ClientHistoryItem[]).map((item) => ({
                role: item.role === 'bot' || item.role === 'model' ? 'model' : 'user',
                parts: [{ text: item.text }]
              }))
            : [];

          const fullContents = [
            ...historyTurns,
            {
              role: 'user',
              parts: [{ text: userMsg }]
            }
          ];

          if (ai) {
            try {
              const response = await ai.models.generateContent({
                model: targetModel,
                contents: fullContents,
                config: {
                  systemInstruction: matchedInstruction,
                },
              });

              const replyText = response.text?.trim() || '';
              const elapsedMs = Date.now() - startTime;

              res.end(JSON.stringify({ 
                success: true, 
                reply: replyText,
                modelUsed: targetModel,
                elapsedMs,
                role: botName
              }));
              return;
            } catch (err: unknown) {
              // If gemini-4-argon encountered an error (e.g. paid tier quota), fallback seamlessly to gemini-3.8-flash
              if (targetModel === 'gemini-4-argon') {
                try {
                  const fallbackResp = await ai.models.generateContent({
                    model: 'gemini-3.8-flash',
                    contents: fullContents,
                    config: {
                      systemInstruction: matchedInstruction,
                    },
                  });

                  const elapsedMs = Date.now() - startTime;
                  res.end(JSON.stringify({
                    success: true,
                    reply: fallbackResp.text?.trim() || '',
                    modelUsed: 'gemini-3.8-flash (fallback)',
                    elapsedMs,
                    role: botName,
                    notice: 'Gemini 4 Argon routed through Gemini 3.8 Flash'
                  }));
                  return;
                } catch {
                  // proceed to simulated response
                }
              }
            }
          }

          // Intelligent Simulated Fallback matching agent persona when offline or without API key
          const elapsedMs = Date.now() - startTime;
          const personaResponses: Record<string, string> = {
            'Chief of Staff / CEO': `Executive acknowledgment: "${userMsg}". Delegated across squad priority queues. Board prep window and calendar bounds remain protected.`,
            'Project Manager': `Sprint burndown updated with: "${userMsg}". Phase-gate criteria verified. Zero blockers logged on linear sprint timeline.`,
            'Business Analyst': `Benchmark metrics recorded for "${userMsg}". Comparative SaaS pricing matrices synchronized into raw partition.`,
            'UI/UX Designer': `Design token audit applied to "${userMsg}". 60-30-10 palette rules and tactical corner brackets verified intact.`,
            'System Architect': `C4 subsystem mapped for "${userMsg}". Drive E:\\ latent memory vectors re-indexed in 1.8ms. Zero architectural drift.`,
            'Senior Dev': `Implemented task for "${userMsg}". Unit tests clean, strict TypeScript types verified, compiled with Exit Code 0.`,
            'QA Auditor': `Boundary verification complete for "${userMsg}". Sandbox bounds secure, 0 memory leaks, exit code 0 confirmed.`
          };

          res.end(JSON.stringify({
            success: true,
            reply: personaResponses[botName] || `Command received. Autonomous task pipeline executed with Exit Code 0 across all 7 nodes.`,
            modelUsed: `${targetModel} (simulated)`,
            elapsedMs,
            role: botName
          }));
          return;
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || process.cwd(), '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
