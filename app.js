const USUARIO_FIXO = "ericfilipe";
const SENHA_HASH_FIXA = "b5b9c7f6e0c4a76c0f3c2dbf8d5f8d6bb1d2e6f9e8e7a6c5d4c3b2a1f0e9d8c7";

let indexEditando = null;
let grafico;

// ================= HASH =================
async function gerarHash(texto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

// ================= LOGIN =================
async function login() {
    const usuario = document.getElementById("usuario")?.value;
    const senha = document.getElementById("senha")?.value;

    const senhaHash = await gerarHash(senha);

    if (usuario === USUARIO_FIXO && senhaHash === SENHA_HASH_FIXA) {
        localStorage.setItem("logado", "true");
        window.location.href = "dashboard.html";
    } else {
        document.getElementById("erro").innerText = "Credenciais inválidas";
    }
}

function logout() {
    localStorage.removeItem("logado");
    window.location.href = "index.html";
}

if (window.location.pathname.includes("dashboard")) {
    if (localStorage.getItem("logado") !== "true") {
        window.location.href = "index.html";
    } else {
        carregarPdvs();
        carregarMaquinetas();
    }
}

// ================= PDV =================
function carregarPdvs() {
    const pdvs = JSON.parse(localStorage.getItem("pdvs")) || [];
    const lista = document.getElementById("listaPdvs");
    const select = document.getElementById("local");

    if (lista) lista.innerHTML = "";
    if (select) select.innerHTML = "";

    pdvs.forEach((pdv, index) => {

        if (lista) {
            lista.innerHTML += `<li>${pdv.nome}
            <button onclick="removerPdv(${index})">Excluir</button></li>`;
        }

        if (select) {
            select.innerHTML += `<option value="${pdv.id}">${pdv.nome}</option>`;
        }
    });
}

function cadastrarPdv() {
    const nome = document.getElementById("novoPdv").value;
    if (!nome) return;

    const pdvs = JSON.parse(localStorage.getItem("pdvs")) || [];
    pdvs.push({ id: Date.now(), nome });

    localStorage.setItem("pdvs", JSON.stringify(pdvs));
    document.getElementById("novoPdv").value = "";
    carregarPdvs();
}

function removerPdv(index) {
    const pdvs = JSON.parse(localStorage.getItem("pdvs")) || [];
    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];

    const pdvId = pdvs[index].id;
    if (maquinetas.some(m => m.local == pdvId)) {
        alert("PDV possui maquinetas vinculadas.");
        return;
    }

    pdvs.splice(index, 1);
    localStorage.setItem("pdvs", JSON.stringify(pdvs));
    carregarPdvs();
}

// ================= MAQUINETAS =================
function salvarMaquineta() {
    const serial = document.getElementById("serial").value;
    const empresa = document.getElementById("empresa").value;
    const admin = document.getElementById("admin").value;
    const local = document.getElementById("local").value;
    const status = document.getElementById("status").value;

    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];

    if (indexEditando !== null) {
        maquinetas[indexEditando] = { ...maquinetas[indexEditando], serial, empresa, admin, local, status };
        indexEditando = null;
    } else {
        maquinetas.push({
            serial, empresa, admin, local, status,
            movimentacoes: [{
                data: new Date().toLocaleString(),
                localAnterior: "-",
                localNovo: local,
                statusAnterior: "-",
                statusNovo: status,
                observacao: "Cadastro inicial"
            }]
        });
    }

    localStorage.setItem("maquinetas", JSON.stringify(maquinetas));
    carregarMaquinetas();
}

function carregarMaquinetas() {
    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];
    const pdvs = JSON.parse(localStorage.getItem("pdvs")) || [];

    const filtro = document.getElementById("filtroStatus")?.value || "Todos";
    const filtradas = filtro === "Todos"
        ? maquinetas
        : maquinetas.filter(m => m.status === filtro);

    const tabela = document.getElementById("tabelaMaquinetas");
    const cardsMobile = document.getElementById("cardsMobile");

    if (tabela) tabela.innerHTML = "";
    if (cardsMobile) cardsMobile.innerHTML = "";

    function nomePdv(id) {
        const encontrado = pdvs.find(p => p.id == id);
        return encontrado ? encontrado.nome : "Removido";
    }

    filtradas.forEach((m, index) => {

        if (tabela) {
            tabela.innerHTML += `
            <tr>
              <td>${m.serial}</td>
              <td>${m.empresa}</td>
              <td>${m.admin}</td>
              <td>${nomePdv(m.local)}</td>
              <td><span class="status ${m.status}">${m.status}</span></td>
              <td>
                <button onclick="verHistorico(${index})">Histórico</button>
                <button onclick="excluir(${index})">Excluir</button>
              </td>
            </tr>`;
        }

        if (cardsMobile) {
            cardsMobile.innerHTML += `
            <div class="mobile-card fade-in">
              <h3>${m.serial}</h3>
              <p>${m.empresa}</p>
              <p>${nomePdv(m.local)}</p>
              <span class="status ${m.status}">${m.status}</span>
              <button onclick="verHistorico(${index})">Histórico</button>
              <button onclick="excluir(${index})">Excluir</button>
            </div>`;
        }
    });

    atualizarDashboard(maquinetas, pdvs);
    gerarGrafico(maquinetas);
}

function excluir(index) {
    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];
    maquinetas.splice(index, 1);
    localStorage.setItem("maquinetas", JSON.stringify(maquinetas));
    carregarMaquinetas();
}

// ================= DASHBOARD =================
function atualizarDashboard(maquinetas, pdvs) {
    const container = document.getElementById("cardsPdvs");
    if (!container) return;

    container.innerHTML = `
        <div class="card-total">
            <h3>Total Geral</h3>
            <p>${maquinetas.length}</p>
        </div>
    `;

    pdvs.forEach(pdv => {
        const total = maquinetas.filter(m => m.local == pdv.id).length;
        container.innerHTML += `
            <div class="card-total">
                <h3>${pdv.nome}</h3>
                <p>${total}</p>
            </div>`;
    });
}

// ================= HISTÓRICO =================
function verHistorico(index) {
    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];
    const m = maquinetas[index];

    const container = document.getElementById("conteudoHistorico");
    container.innerHTML = "";

    m.movimentacoes?.slice().reverse().forEach(mov => {
        container.innerHTML += `
        <div class="fade-in">
          <strong>${mov.data}</strong><br>
          ${mov.localAnterior} → ${mov.localNovo}<br>
          ${mov.statusAnterior} → ${mov.statusNovo}<hr>
        </div>`;
    });

    document.getElementById("modalHistorico").style.display = "flex";
}

function fecharModal() {
    document.getElementById("modalHistorico").style.display = "none";
}

// ================= GRÁFICO =================
function gerarGrafico(maquinetas) {
    const contagem = {};
    maquinetas.forEach(m => contagem[m.admin] = (contagem[m.admin] || 0) + 1);

    const ctx = document.getElementById("graficoAdmin");
    if (!ctx) return;

    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(contagem),
            datasets: [{
                label: "Por Administradora",
                data: Object.values(contagem)
            }]
        }
    });
}

// ================= BACKUP =================
function backupSistema() {
    const dados = {
        pdvs: JSON.parse(localStorage.getItem("pdvs")) || [],
        maquinetas: JSON.parse(localStorage.getItem("maquinetas")) || []
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "backup_maquinetas.json";
    a.click();
}