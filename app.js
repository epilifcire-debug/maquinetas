// ================= CONFIG =================

const USUARIO_FIXO = "ericfilipe";
const TEMPO_EXPIRACAO = 30 * 60 * 1000; // 30 minutos

let indexEditando = null;
let grafico;

// ================= INICIALIZA SENHA PADRÃO =================

// Se ainda não existir senha salva, cria a padrão
if (!localStorage.getItem("senhaAdmin")) {
    localStorage.setItem("senhaAdmin", "Er1288@"); // senha inicial
}

// ================= SESSÃO =================

function iniciarSessao() {
    localStorage.setItem("logado", "true");
    localStorage.setItem("expiraEm", Date.now() + TEMPO_EXPIRACAO);
}

function verificarSessao() {
    const expiraEm = localStorage.getItem("expiraEm");

    if (!expiraEm || Date.now() > expiraEm) {
        logout();
    }
}

// ================= LOGIN =================

function login() {
    const usuario = document.getElementById("usuario")?.value;
    const senha = document.getElementById("senha")?.value;

    const senhaSalva = localStorage.getItem("senhaAdmin");

    if (usuario === USUARIO_FIXO && senha === senhaSalva) {
        iniciarSessao();
        window.location.href = "dashboard.html";
    } else {
        document.getElementById("erro").innerText = "Credenciais inválidas";
    }
}

function logout() {
    localStorage.removeItem("logado");
    localStorage.removeItem("expiraEm");
    window.location.href = "index.html";
}

// ================= PROTEÇÃO DASHBOARD =================

if (window.location.pathname.includes("dashboard")) {
    if (localStorage.getItem("logado") !== "true") {
        window.location.href = "index.html";
    } else {
        verificarSessao();
        carregarPdvs();
        carregarMaquinetas();
    }
}

// ================= TROCAR SENHA =================

function trocarSenha() {
    const nova = prompt("Digite a nova senha:");

    if (!nova || nova.length < 4) {
        alert("Senha inválida.");
        return;
    }

    localStorage.setItem("senhaAdmin", nova);
    alert("Senha alterada com sucesso!");
}

// ================= PDV =================

function carregarPdvs() {
    const pdvs = JSON.parse(localStorage.getItem("pdvs")) || [];
    const lista = document.getElementById("listaPdvs");
    const select = document.getElementById("local");

    if (lista) lista.innerHTML = "";
    if (select) select.innerHTML = "";

    pdvs.sort((a, b) => a.nome.localeCompare(b.nome));

    pdvs.forEach((pdv, index) => {

        if (lista) {
            lista.innerHTML += `
                <li>${pdv.nome}
                    <button onclick="removerPdv(${index})">Excluir</button>
                </li>`;
        }

        if (select) {
            select.innerHTML += `
                <option value="${pdv.id}">${pdv.nome}</option>`;
        }
    });
}

function cadastrarPdv() {
    const nome = document.getElementById("novoPdv").value;
    if (!nome) return alert("Digite um nome para o PDV");

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
        return alert("Não é possível excluir PDV com maquinetas vinculadas.");
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
            statusNovo: status,
            observacao: "Cadastro inicial"
        }]
    });

    localStorage.setItem("maquinetas", JSON.stringify(maquinetas));
    carregarMaquinetas();
}

function excluir(index) {
    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];
    maquinetas.splice(index, 1);
    localStorage.setItem("maquinetas", JSON.stringify(maquinetas));
    carregarMaquinetas();
}

function carregarMaquinetas() {
    const maquinetas = JSON.parse(localStorage.getItem("maquinetas")) || [];
    const pdvs = JSON.parse(localStorage.getItem("pdvs")) || [];

    const tabela = document.getElementById("tabelaMaquinetas");
    const cardsMobile = document.getElementById("cardsMobile");

    if (tabela) tabela.innerHTML = "";
    if (cardsMobile) cardsMobile.innerHTML = "";

    function nomePdv(id) {
        const encontrado = pdvs.find(p => p.id == id);
        return encontrado ? encontrado.nome : "Removido";
    }

    maquinetas.forEach((m, index) => {

        if (tabela) {
            tabela.innerHTML += `
            <tr>
                <td>${m.serial}</td>
                <td>${m.empresa}</td>
                <td>${m.admin}</td>
                <td>${nomePdv(m.local)}</td>
                <td>${m.status}</td>
                <td>
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
                <button onclick="excluir(${index})">Excluir</button>
            </div>`;
        }
    });
}

// ================= MENU MOBILE =================

function toggleMenu() {
    document.querySelector(".sidebar")?.classList.toggle("ativo");
}
