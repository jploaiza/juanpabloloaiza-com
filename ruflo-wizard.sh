#!/bin/bash

# ==============================================================================
# RUFLO ULTIMATE WIZARD v3.5 - Configuración de Máxima Potencia
# ==============================================================================

set -e

# Timeout compatible con macOS (evita deadlock de stdin y procesos huérfanos)
run_with_timeout() {
    local limit=$1
    shift
    "$@" < /dev/null &
    local pid=$!
    ( sleep "$limit" && kill -9 "$pid" 2>/dev/null ) &
    local watcher=$!
    wait "$pid" 2>/dev/null || true
    kill -9 "$watcher" 2>/dev/null || true
}

echo "🌊 BIENVENIDO AL WIZARD ULTIMATE DE RUFLO (CLAUDE-FLOW)"
echo "------------------------------------------------------"

# 1. Validación de Entorno
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no detectado. Instala v18+ antes de continuar."
    exit 1
fi

# 2. Instalación y Actualización (con caché de 5 días)
UPDATE_STAMP=".claude-flow/.last-update-check"
UPDATE_INTERVAL=$((5 * 86400)) # 5 días en segundos

_needs_update() {
    [[ ! -f "$UPDATE_STAMP" ]] && return 0
    local last_check now elapsed
    last_check=$(cat "$UPDATE_STAMP" 2>/dev/null)
    now=$(date +%s)
    elapsed=$(( now - last_check ))
    [[ $elapsed -ge $UPDATE_INTERVAL ]] && return 0
    return 1
}

if _needs_update; then
    echo "📦 Asegurando versiones más recientes (v3.5+)..."
    npm install -g @anthropic-ai/claude-code ruflo@latest
    date +%s > "$UPDATE_STAMP"
else
    _days_left=$(( (UPDATE_INTERVAL - ($(date +%s) - $(cat "$UPDATE_STAMP"))) / 86400 ))
    echo "✅ Actualización omitida (próxima revisión en ~${_days_left} día(s))."
fi

# 3. Inicialización del Proyecto
echo "🏗️ Preparando base del proyecto..."
npx ruflo init --full --force

# 4. Configuración de Topología (WASM Optimized)
echo ""
echo "⚙️  PASO 1: TOPOLOGÍA DEL ENJAMBRE"
echo "1) Hierarchical (Recomendado: Máximo control anti-drift)"
echo "2) Mesh (Máxima velocidad, agentes pares)"
echo "3) Hybrid V3 (15 agentes, jerárquico-malla)"
read -p "Selecciona topología [1-3]: " topo_opt

case $topo_opt in
    2) TOPO="mesh"; MAX_A=8 ;;
    3) TOPO="hierarchical-mesh"; MAX_A=15 ;;
    *) TOPO="hierarchical"; MAX_A=8 ;;
esac

npx ruflo swarm init --topology $TOPO --max-agents $MAX_A --strategy specialized

# 5. Generación de Agentes (WIZARD INTERACTIVO)
echo ""
echo "🤖 PASO 2: CONFIGURACIÓN DEL ROSTER DE AGENTES"
echo "¿Deseas aplicar la CONFIGURACIÓN BASE recomendada?"
echo "(1 Coordinator, 1 Architect, 2 Coders, 1 Tester, 1 Reviewer)"
read -p "[s/n]: " use_base

if [ "$use_base" = "s" ]; then
    npx ruflo agent spawn --type coordinator --name "Queen-Leader"
    npx ruflo agent spawn --type architect --name "Arch-Master"
    npx ruflo agent spawn --type coder --name "Dev-1"
    npx ruflo agent spawn --type coder --name "Dev-2"
    npx ruflo agent spawn --type tester --name "QA-Bot"
    npx ruflo agent spawn --type reviewer --name "Code-Reviewer"
    echo "✅ Base instalada."
else
    read -p "¿Cuántos agentes quieres crear en total? " total_agents
    for ((i=1; i<=total_agents; i++)); do
        echo "--- Agente $i ---"
        echo "Tipos disponibles: coordinator, coder, tester, reviewer, architect, researcher, security-architect"
        read -p "Tipo: " a_type
        read -p "Nombre: " a_name
        npx ruflo agent spawn --type $a_type --name $a_name
    done
fi

# 6. Configuración ADR-026 (Enrutamiento de 3 Niveles)
echo ""
echo "💸 PASO 3: OPTIMIZACIÓN DE COSTOS (ADR-026)"
echo "Configurando enrutamiento inteligente..."
run_with_timeout 10 npx ruflo config set --key modelTier1 --value "wasm-local"
run_with_timeout 10 npx ruflo config set --key modelTier2 --value "claude-3-haiku"
run_with_timeout 10 npx ruflo config set --key modelTier3 --value "claude-3-5-sonnet"
run_with_timeout 10 npx ruflo config set --key maxBudgetUsd --value "15.0"

# 7. SONA & RuVector (Aprendizaje Continuo)
echo ""
echo "🧠 PASO 4: APRENDIZAJE SONA Y RUVECTOR"
echo "Activando el cerebro persistente..."
run_with_timeout 60 npx ruflo neural train --epochs 10
run_with_timeout 10 npx ruflo config set --key enableLearning --value "true"
run_with_timeout 10 npx ruflo config set --key memoryBackend --value "hybrid" # SQLite + AgentDB HNSW

# 8. Security Gates (Puertas de Seguridad)
echo ""
echo "🛡️ PASO 5: CUATRO PUERTAS DE SEGURIDAD CRÍTICAS"
echo "Inyectando reglas en CLAUDE.md..."
# Sobrescribimos o añadimos la sección de seguridad
cat <<EOT >> CLAUDE.md

## Security Gates (Enforcement)
- **Destructive Gate**: Block 'rm -rf' and destructive actions via SafeExecutor. [1]
- **Secret Gate**: Scan for API keys/tokens in every agent output. [6, 1]
- **Continuity Gate**: Kill agents if 'rework_ratio' exceeds 0.8 (Anti-loop). 
- **Authority Gate**: Require Human-In-The-Loop (HITL) for production merges. 
EOT

# 9. Activación Final (Corrección del error 0/15)
echo ""
echo "🚀 PASO FINAL: PUESTA EN MARCHA"
echo "Reparando métricas y activando Daemon..."
npx ruflo doctor --fix # Asegura que los archivos de métricas existan
npx ruflo daemon start --detach 2>/dev/null || nohup npx ruflo daemon start &>/dev/null & # Activa los 12 workers en fondo
claude mcp add ruflo -- npx -y ruflo@latest # Vinculación final

# Sincronización de trayectorias al final (no bloquea pasos críticos)
echo "🧠 Sincronizando cerebro de aprendizaje..."
run_with_timeout 8 npx ruflo hooks intelligence --status 2>/dev/null || true

echo "------------------------------------------------------"
echo "✅ ¡WIZARD COMPLETADO A MÁXIMA POTENCIA!"
echo "Tu visor ya no debería marcar 0/15 al procesar tareas."
echo "Ejecuta 'claude' para empezar a trabajar."
