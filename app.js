console.log("EFC ERP FULL VERSION");

// ================= CONFIG =================

const USUARIO = "ericfilipe";
const SENHA_PADRAO = "Er1288@";
const TEMPO_EXPIRACAO = 30 * 60 * 1000;

let indexEditando = null;
let grafico = null;

// ================= INICIALIZA SENHA =================

if (!localStorage.getItem("senhaAdmin")) {
    localStorage.setItem("senhaAdmin", SENHA_PADRAO);
}

// ================= LOGIN =================

function login() {
    const usuario = document.getElementById("usuario")?.value.trim();
    const senha = document.getElementById("senha")?.value.trim();
    const senhaSalva = localStorage.getItem("senhaAdmin");

    if (usuario === USUARIO && senha === senhaSalva) {
        localStorage.setItem("logado", "true");
        localStorage.setItem("expiraEm", Date.now() + TEMPO_EXPIRACAO);
        window.location.href = "./dashboard.html";
    } else {
        document.getElementById("erro").innerText = "Credenciais inválidas";
    }
}

function logout() {
    localStorage.removeItem("logado");
    localStorage.removeItem("expiraEm");
    window.location.href = "./index.html";
}

// ================= PROTEÇÃO =================

function protegerDashboard() {
    if (!window.location.pathname.includes("dashboard")) return;

    const logado = localStorage.getItem("logado");
    const expiraEm = localStorage.getItem("expiraEm");

    if (logado !== "true" || !expiraEm || Date.now() > parseInt(expiraEm)) {
        logout();
    }
}

// ================= PDVs =================

function carregarPdvs() {
    const pdvs = JSON.parse(localStorage.getItem("pdvs")) || [];
    const select = document.getElementById("local");
    const lista = document.getElementById("listaPdvs");

    if (select) select.innerHTML = "";
    if (lista) lista.innerHTML = "";

    pdvs.forEach((pdv, index) => {

        if (select) {
            select.innerHTML += `<option value="${pdv.id}">${pdv.nome}</option>`;
        }

        if (lista) {
            lista.innerHTML += `
                <li>${pdv.nome}
                    <button onclick="removerPdv(${index})">Excluir</button>
                </li>`;
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

    if (maquinetas.some(m => m.local == pdvs[index].id)) {
        alert("Existem maquinetas vinculadas a este PDV.");
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

        const antiga = maquinetas[indexEditando];

        if (antiga.local !== local || antiga.status !== status) {
            antiga.movimentacoes.push({
                data: new Date().toLocaleString(),
                localAnterior: antiga.local,
                localNovo: local,
                statusAnterior: antiga.status,
                statusNovo: status
            });
        }

        maquinetas[indexEditando] = {
            ...antiga,
            serial,
            empresa,
            admin,
            local,
            status
        };

        indexEditando = null;

    } else {

        maquinetas.push({
            serial,
            empresa,
            admin,
            local,
            status,
            movimentacoes: [{
                data: new Date().toLocaleString(),
                localAnterior: "-",
                localNovo: local,
                statusAnterior: "-",
                statusNovo: status
            }]
        });
    }

    localStorage.setItem("maquinetas", JSON.stringify(maquinetas));
    carregarMaquinetas();
}

function editar(index) {
    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];
    const m = maquinetas[index];

    document.getElementById("serial").value = m.serial;
    document.getElementById("empresa").value = m.empresa;
    document.getElementById("admin").value = m.admin;
    document.getElementById("local").value = m.local;
    document.getElementById("status").value = m.status;

    indexEditando = index;
}

function excluir(index) {
    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];
    maquinetas.splice(index, 1);
    localStorage.setItem("maquinetas", JSON.stringify(maquinetas));
    carregarMaquinetas();
}

// ================= HISTÓRICO =================

function verHistorico(index) {

    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];
    const m = maquinetas[index];

    const container = document.getElementById("conteudoHistorico");
    if (!container) return;

    container.innerHTML = "";

    m.movimentacoes.slice().reverse().forEach(mov => {
        container.innerHTML += `
            <div>
                <strong>${mov.data}</strong><br>
                ${mov.localAnterior} → ${mov.localNovo}<br>
                ${mov.statusAnterior} → ${mov.statusNovo}
                <hr>
            </div>
        `;
    });

    document.getElementById("modalHistorico").style.display = "flex";
}

function fecharModal() {
    document.getElementById("modalHistorico").style.display = "none";
}

// ================= CARREGAR =================

function carregarMaquinetas() {

    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];
    const pdvs = JSON.parse(localStorage.getItem("pdvs")) || [];
    const filtro = document.getElementById("filtroStatus")?.value || "Todos";

    const tabela = document.getElementById("tabelaMaquinetas");
    const cardsMobile = document.getElementById("cardsMobile");

    if (tabela) tabela.innerHTML = "";
    if (cardsMobile) cardsMobile.innerHTML = "";

    const filtradas = filtro === "Todos"
        ? maquinetas
        : maquinetas.filter(m => m.status === filtro);

    function nomePdv(id) {
        const p = pdvs.find(p => p.id == id);
        return p ? p.nome : "Removido";
    }

    filtradas.forEach((m, index) => {

        if (tabela) {
            tabela.innerHTML += `
                <tr>
                    <td>${m.serial}</td>
                    <td>${m.empresa}</td>
                    <td>${m.admin}</td>
                    <td>${nomePdv(m.local)}</td>
                    <td>${m.status}</td>
                    <td>
                        <button onclick="editar(${index})">Editar</button>
                        <button onclick="verHistorico(${index})">Histórico</button>
                        <button onclick="excluir(${index})">Excluir</button>
                    </td>
                </tr>`;
        }

        if (cardsMobile) {
            cardsMobile.innerHTML += `
                <div class="mobile-card">
                    <h3>${m.serial}</h3>
                    <p>${m.empresa}</p>
                    <p>${nomePdv(m.local)}</p>
                    <p>${m.status}</p>
                    <button onclick="editar(${index})">Editar</button>
                    <button onclick="verHistorico(${index})">Histórico</button>
                    <button onclick="excluir(${index})">Excluir</button>
                </div>`;
        }
    });

    gerarGrafico(maquinetas);
}

// ================= GRÁFICO =================

function gerarGrafico(maquinetas) {

    const contagem = {};

    maquinetas.forEach(m => {
        contagem[m.admin] = (contagem[m.admin] || 0) + 1;
    });

    const ctx = document.getElementById("graficoAdmin");
    if (!ctx) return;

    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(contagem),
            datasets: [{
                label: "Maquinetas por Administradora",
                data: Object.values(contagem)
            }]
        }
    });
}

// ================= BACKUP =================

function backupSistema() {

    const dados = {
        pdvs: JSON.parse(localStorage.getItem("pdvs")) || [],
        maquinetas: JSON.parse(localStorage.getItem("maquinetas")) || [],
        senhaAdmin: localStorage.getItem("senhaAdmin")
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "backup_efc.json";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

// ================= INIT =================

document.addEventListener("DOMContentLoaded", () => {

    protegerDashboard();

    document.getElementById("btnLogin")?.addEventListener("click", login);
    document.getElementById("btnBackup")?.addEventListener("click", backupSistema);

    carregarPdvs();
    carregarMaquinetas();
});
