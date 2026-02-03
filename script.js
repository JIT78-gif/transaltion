/**
 * =========================================================================
 * CONFIGURAÇÕES GERAIS
 * =========================================================================
 */
// Olá Jit essa é uma mensagem traduzida por IA onde ela ánalisa o contexto sem fazer traduções literais

const N8N_WEBHOOK_URL = 'https://agentes-n8n.cb16s5.easypanel.host/webhook/e0764039-04f3-42d7-97d3-2912baa7e6e2';

// Seleção de elementos para manipulação via DOM
const formElement = document.getElementById('translate-form');
const chatContainer = document.getElementById('chat-box');
const fileInput = document.getElementById('audio');
const fileLabel = document.querySelector('.file-status');
const submitBtn = document.getElementById('btn-translate');

/**
 * =========================================================================
 * ESCUTA DE EVENTOS - INTERFACE
 * =========================================================================
 */

// Monitora quando o usuário anexa um arquivo para dar feedback visual
fileInput.addEventListener('change', function (evento) {
    const listaArquivos = evento.target.files;

    if (listaArquivos.length > 0) {
        const nomeDoArquivo = listaArquivos[0].name;
        fileLabel.textContent = "Arquivo pronto: " + nomeDoArquivo;
        // Destaque visual na borda (estilo WhatsApp ativo)
        document.querySelector('.custom-file-upload').style.borderColor = "var(--wa-accent)";
    } else {
        fileLabel.textContent = "Selecionar arquivo (.mp3, .mp4)";
        document.querySelector('.custom-file-upload').style.borderColor = "var(--border)";
    }
});

/**
 * =========================================================================
 * PROCESSAMENTO E ENVIO (LÓGICA DESCOMPACTADA)
 * =========================================================================
 */

async function processarEnvioTraducao(event) {
    // 1. Interrompe o comportamento padrão do navegador (recarregamento)
    event.preventDefault();

    const dadosBrutos = new FormData(formElement);
    const textoMensagem = dadosBrutos.get('message');
    const arquivoAudio = dadosBrutos.get('audio');
    const selecaoIdioma = dadosBrutos.get('mode');

    // CAPTURA O NÚMERO E NOME DO CONTATO SELECIONADO NO CABEÇALHO
    const contactSelectElement = document.getElementById('contact-select');
    const numeroSelecionado = contactSelectElement.value;
    const nomeContatoSelecionado = contactSelectElement.options[contactSelectElement.selectedIndex].text;

    // VALIDAÇÃO: Garante que um contato foi selecionado
    if (!numeroSelecionado || numeroSelecionado.trim() === "") {
        alert("Erro: Por favor, selecione um contato antes de enviar.");
        return;
    }

    const temTexto = textoMensagem !== null && textoMensagem.trim() !== "";
    const temAudio = arquivoAudio !== null && arquivoAudio.size > 0;

    if (!temTexto && !temAudio) {
        alert("Erro: Você precisa digitar algo ou enviar um áudio para traduzir.");
        return;
    }

    const payloadParaN8n = new FormData();
    // Only append mensagem_texto if there is actual text content (prevents literal "null")
    if (temTexto) {
        payloadParaN8n.append('mensagem_texto', textoMensagem);
    } else {
        payloadParaN8n.append('mensagem_texto', '');
    }

    // ENHANCED DEBUGGING: Log detalhado do número sendo enviado
    console.log("═══════════════════════════════════════════════");
    console.log("📤 DEBUGGING: Dados sendo enviados para n8n");
    console.log("═══════════════════════════════════════════════");
    console.log("Contato Selecionado:", nomeContatoSelecionado);
    console.log("Número de Destino (numero_destino):", numeroSelecionado);
    console.log("Mensagem de Texto:", textoMensagem || "(vazio)");
    console.log("Arquivo de Áudio:", temAudio ? arquivoAudio.name : "(nenhum)");

    payloadParaN8n.append('numero_destino', numeroSelecionado); // Novo campo enviado ao n8n

    // ... restante do código de áudio e fetch ...

    // Lógica detalhada do Áudio
    if (temAudio) {
        payloadParaN8n.append('audio_file', arquivoAudio);
        payloadParaN8n.append('status_audio', 'true');
    } else {
        payloadParaN8n.append('audio_file', ''); // Envia campo vazio
        payloadParaN8n.append('status_audio', 'false');
    }

    /**
     * 5. MAPEAMENTO DE IDIOMAS (CAMPOS INDIVIDUAIS)
     * Quebramos a lógica do select para que o n8n receba variáveis puras.
     */
    let origem = "auto";
    let destino = "auto";

    if (selecaoIdioma === "pt-en") {
        origem = "Português";
        destino = "Inglês";
    } else if (selecaoIdioma === "en-pt") {
        origem = "Inglês";
        destino = "Português";
    }

    // Adicionamos os campos individuais que a IA usará no prompt
    payloadParaN8n.append('idioma_atual', origem);
    payloadParaN8n.append('idioma_destino', destino);

    /**
     * 6. FEEDBACK VISUAL NO BOTÃO
     */
    const textoOriginalBotao = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> ENVIANDO PARA IA...';
    submitBtn.disabled = true;

    /**
     * 7. ENVIO PARA O WEBHOOK (BACKEND)
     */
    try {
        const conexao = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            body: payloadParaN8n // O n8n recebe como multipart/form-data
        });

        if (!conexao.ok) {
            throw new Error('O servidor n8n respondeu com erro.');
        }

        // Converte a resposta recebida do workflow
        const respostaIa = await conexao.json();

        // ENHANCED DEBUGGING: Log da resposta do n8n
        console.log("📥 DEBUGGING: Resposta recebida do n8n:", respostaIa);
        console.log("═══════════════════════════════════════════════");

        // 8. Renderiza a mensagem no chat com informações do destinatário
        exibirMensagemNoChat(respostaIa, nomeContatoSelecionado, numeroSelecionado);

        // 9. Exibe confirmação visual de sucesso
        alert(`✅ Mensagem enviada com sucesso para ${nomeContatoSelecionado} (${numeroSelecionado})!`);

        // 10. Reseta o formulário e estados visuais
        formElement.reset();
        fileLabel.textContent = "Selecionar arquivo (.mp3, .mp4)";
        document.querySelector('.custom-file-upload').style.borderColor = "var(--border)";

    } catch (erro) {
        console.error("❌ DEBUGGING: Erro crítico no envio:", erro);
        console.log("═══════════════════════════════════════════════");
        alert(`Houve um problema na comunicação com a IA ao enviar para ${nomeContatoSelecionado}.\n\nVerifique o console para mais detalhes.`);
    } finally {
        // Retorna o botão ao estado original independente de sucesso ou erro
        submitBtn.innerHTML = textoOriginalBotao;
        submitBtn.disabled = false;
    }
}

/**
 * =========================================================================
 * RENDERIZAÇÃO DA RESPOSTA NO CHAT
 * =========================================================================
 */

function exibirMensagemNoChat(dados, nomeContato, numeroContato) {
    // Se o n8n retornar um array, acessamos o primeiro objeto
    const item = Array.isArray(dados) ? dados[0] : dados;

    const novoBalao = document.createElement('div');
    novoBalao.className = 'message mine'; // Estilo verde (enviado)

    // Extração segura de campos (baseada no seu ChatWork.json)
    const textoTraduzido = item.output || "Erro ao processar tradução.";
    const textoOriginal = item.originalText || "---";
    const infoIdioma = item.detectedLang || "Detecção Automática";

    novoBalao.innerHTML = `
        <span class="msg-header">SISTEMA DE TRADUÇÃO MULTIPLICA</span>
        <div class="msg-content">
            <p>${textoTraduzido}</p>
            <span class="tag-translated">
                <i class="fas fa-globe"></i> 
                Original: ${textoOriginal} | Lang: ${infoIdioma}
            </span>
            <span class="tag-recipient" style="display: block; margin-top: 6px; font-size: 0.85em; opacity: 0.8;">
                <i class="fas fa-paper-plane"></i> 
                Enviado para: ${nomeContato} (${numeroContato})
            </span>
        </div>
    `;

    chatContainer.appendChild(novoBalao);

    // Rola o chat para o final (Crítico para Mobile)
    setTimeout(() => {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

// Ativa o formulário para escutar o clique no botão de submit
formElement.addEventListener('submit', processarEnvioTraducao);