/**
 *CONFIGURAÇÕES GERAIS
 * Define as constantes globais do sistema.
 */
const N8N_WEBHOOK_URL = 'https://agentes-n8n.cb16s5.easypanel.host/webhook/e0764039-04f3-42d7-97d3-2912baa7e6e2';
const formElement = document.getElementById('translate-form');
const chatContainer = document.getElementById('chat-box');
const fileInput = document.getElementById('audio');
const fileLabel = document.querySelector('.file-status');
const submitBtn = document.getElementById('btn-translate');
const credencialInput = document.getElementById('credencial');
const contactSelect = document.getElementById('contact-select');

/**
 * SEGURANÇA
 * Funções relacionadas à criptografia e proteção de dados.
 */
async function gerarHashCriptografico(textoPuro) {
    const codificador = new TextEncoder();
    const dadosEmUint8 = codificador.encode(textoPuro);
    
    // Gera o buffer do hash usando o algoritmo SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', dadosEmUint8);
    
    // Converte o buffer para um array de bytes
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    // Converte cada byte em uma string hexadecimal de 2 caracteres
    const hashHexadecimal = hashArray.map(function(byte) {
        return byte.toString(16).padStart(2, '0');
    }).join('');
    
    return hashHexadecimal;
}

/**
 * INTERFACE E FEEDBACK VISUAL
 * Funções que manipulam o DOM para informar o usuário.
 */
function atualizarStatusArquivo(evento) {
    const arquivos = evento.target.files;
    const areaUpload = document.querySelector('.custom-file-upload');

    if (arquivos.length > 0) {
        const nomeArquivo = arquivos[0].name;
        fileLabel.textContent = "Arquivo pronto: " + nomeArquivo;
        areaUpload.style.borderColor = "var(--wa-accent)";
    } else {
        
        fileLabel.textContent = "Selecionar arquivo (.mp3, .mp4)";
        areaUpload.style.borderColor = "var(--border)";
    }
}

function adicionarMensagemAoChat(dadosResposta, nomeContato, numeroContato) {
    // Tratamento para garantir que temos um objeto válido, mesmo que venha em lista
    let dadosTratados;
    if (Array.isArray(dadosResposta)) {
        dadosTratados = dadosResposta[0];
    } else {
        dadosTratados = dadosResposta;
    }

    const balaoMensagem = document.createElement('div');
    balaoMensagem.className = 'message mine'; // Classe para mensagens enviadas (estilo verde)

    // Definição clara dos textos para exibição
    const textoTraduzido = dadosTratados.output || "Tradução concluída.";
    const textoOriginal = dadosTratados.originalText || "Não disponível";
    const idiomaDetectado = dadosTratados.detectedLang || "Automático";

    balaoMensagem.innerHTML = `
        <span class="msg-header">SISTEMA DE TRADUÇÃO MULTIPLICA</span>
        <div class="msg-content">
            <p>${textoTraduzido}</p>
            <span class="tag-translated">
                <i class="fas fa-globe"></i> 
                Original: ${textoOriginal} | Idioma: ${idiomaDetectado}
            </span>
            <span class="tag-recipient" style="display: block; margin-top: 6px; font-size: 0.85em; opacity: 0.8;">
                <i class="fas fa-paper-plane"></i> 
                Enviado para: ${nomeContato} (${numeroContato})
            </span>
        </div>
    `;

    chatContainer.appendChild(balaoMensagem);

    // Rola a tela suavemente para a última mensagem
    setTimeout(function() {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

/**
 * LÓGICA DE NEGÓCIO E COMUNICAÇÃO
 * Captura, validação e envio dos dados para o Webhook.
 */
async function processarFormulario(event) {
    // Impede o recarregamento da página
    event.preventDefault();

    // 1. Validação de Credenciais
    const senhaDigitada = credencialInput.value;
    if (senhaDigitada === "") {
        alert("Por favor, informe a Chave de Acesso para continuar.");
        return;
    }

    // Bloqueia o botão para evitar envios duplos
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> VALIDANDO...';

    try {
        // 2. Preparação da Segurança e Dados
        const hashAutenticacao = await gerarHashCriptografico(senhaDigitada);
        
        const dadosFormulario = new FormData(formElement);
        const numeroDestino = contactSelect.value;
        const nomeDestinatario = contactSelect.options[contactSelect.selectedIndex].text;
        
        const mensagemTexto = dadosFormulario.get('message');
        const arquivoAudio = dadosFormulario.get('audio');

        // 3. Construção do Payload de envio
        const payloadEnvio = new FormData();
        payloadEnvio.append('numero_destino', numeroDestino);
        payloadEnvio.append('mensagem_texto', mensagemTexto);

        if (arquivoAudio && arquivoAudio.size > 0) {
            payloadEnvio.append('audio_file', arquivoAudio);
            payloadEnvio.append('status_audio', 'true');
        } else {
            payloadEnvio.append('status_audio', 'false');
        }

        // 4. Requisição HTTP
        const respostaServidor = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'X-Webhook-Auth': hashAutenticacao
            },
            body: payloadEnvio 
        });

        if (respostaServidor.ok === false) {
            throw new Error("O servidor retornou um erro: " + respostaServidor.status);
        }

        const dadosJSON = await respostaServidor.json();

        // 5. Finalização e Feedback
        adicionarMensagemAoChat(dadosJSON, nomeDestinatario, numeroDestino);
        
        // Reseta o formulário e interface de arquivo
        formElement.reset();
        fileLabel.textContent = "Selecionar arquivo (.mp3, .mp4)";
        document.querySelector('.custom-file-upload').style.borderColor = "var(--border)";

    } catch (erro) {
        console.error("Erro durante o processo:", erro);
        alert("Não foi possível realizar a tradução. Detalhes: " + erro.message);
    } finally {
        // Reativa o botão independente do sucesso ou falha
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>ENVIAR E TRADUZIR</span> <i class="fas fa-paper-plane"></i>';
    }
}

/**
 * INICIALIZAÇÃO DOS EVENTOS
 * Conecta os elementos do HTML às funções do JavaScript.
 */
fileInput.addEventListener('change', atualizarStatusArquivo);
formElement.addEventListener('submit', processarFormulario);