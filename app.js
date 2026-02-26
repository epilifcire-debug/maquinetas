console.log("EFC ERP FINAL ATIVO");

// ================= CONFIG =================

const USUARIO = "ericfilipe";
const SENHA_PADRAO = "Er1288@";
const TEMPO_EXPIRACAO = 30 * 60 * 1000;

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

// ================= LOGOUT =================

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

// ================= CRUD SIMPLES =================

function salvarMaquineta() {

    const serial = document.getElementById("serial").value;
    const empresa = document.getElementById("empresa").value;
    const admin = document.getElementById("admin").value;
    const local = document.getElementById("local").value;
    const status = document.getElementById("status").value;

    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];

    maquinetas.push({ serial, empresa, admin, local, status });

    localStorage.setItem("maquinetas", JSON.stringify(maquinetas));

    carregarMaquinetas();
}

function carregarMaquinetas() {

    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];
    const tabela = document.getElementById("tabelaMaquinetas");

    if (!tabela) return;

    tabela.innerHTML = "";

    maquinetas.forEach((m, index) => {
        tabela.innerHTML += `
            <tr>
                <td>${m.serial}</td>
                <td>${m.empresa}</td>
                <td>${m.admin}</td>
                <td>${m.local}</td>
                <td>${m.status}</td>
                <td><button onclick="excluir(${index})">Excluir</button></td>
            </tr>
        `;
    });
}

function excluir(index) {

    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];
    maquinetas.splice(index, 1);

    localStorage.setItem("maquinetas", JSON.stringify(maquinetas));

    carregarMaquinetas();
}

// ================= EVENTOS =================

document.addEventListener("DOMContentLoaded", () => {

    protegerDashboard();

    const btnLogin = document.getElementById("btnLogin");
    if (btnLogin) btnLogin.addEventListener("click", login);

    const btnBackup = document.getElementById("btnBackup");
    if (btnBackup) btnBackup.addEventListener("click", backupSistema);

    carregarMaquinetas();
});
