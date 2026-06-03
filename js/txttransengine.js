// Pro Docx Translator - Найдвартай хамгаалагдсан код
(function() {
    const _0x_sec_key = "translate_engine_v1";

    // 1. Word файл уншигч
    function _handleFileLoad(input) {
        const file = input.files[0];
        if (!file) return;
        document.getElementById('file-status').innerText = `Loaded: ${file.name}`;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                .then(function(result) {
                    document.getElementById('in').innerHTML = result.value;
                })
                .catch(function(err) {
                    alert("Үл мэдэгдэх Word файл байна: " + err);
                });
        };
        reader.readAsArrayBuffer(file);
    }

    // 2. Үндсэн орчуулгын логик
    async function _startTranslation() {
        const _inArea = document.getElementById('in');
        const inputHtml = _inArea.innerHTML.trim();
        const target = document.getElementById('targetLang').value;
        if (!inputHtml || inputHtml === _inArea.getAttribute('placeholder')) return;

        const btn = document.getElementById('btn');
        const btnTxt = document.getElementById('btn-txt');
        const pBar = document.getElementById('progress');

        btn.disabled = true;
        btnTxt.innerText = "Processing...";

        const parser = new DOMParser();
        const doc = parser.parseFromString(inputHtml, 'text/html');
        const textNodes = [];
        const walk = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
        let node;

        while (node = walk.nextNode()) {
            if (node.textContent.trim().length > 0 && !node.parentElement.closest('script, style')) {
                textNodes.push(node);
            }
        }

        for (let i = 0; i < textNodes.length; i++) {
            const percent = Math.round(((i + 1) / textNodes.length) * 100);
            pBar.style.width = percent + "%";
            btnTxt.innerText = `Translating ${percent}%...`;

            try {
                const text = textNodes[i].textContent.trim();
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
                
                const response = await fetch(url);
                const result = await response.json();

                if (result && result[0]) {
                    const translatedText = result[0].map(x => x[0]).join("");
                    textNodes[i].textContent = translatedText;
                }
            } catch (e) {
                console.error("Error at node:", i, e);
            }
        }

        document.getElementById('out').innerHTML = doc.body.innerHTML;

        const dlBtn = document.getElementById('download-btn');
        dlBtn.disabled = false;
        dlBtn.style.background = "var(--accent)";
        dlBtn.style.cursor = "pointer";
        btn.disabled = false;
        btnTxt.innerText = "Translate Now";
        pBar.style.width = "0%";
    }

    // 3. Татаж авах функц
    function _downloadWordResult() {
        const outHtml = document.getElementById('out').innerHTML;
        if (!outHtml) return;
        const converted = htmlDocx.asBlob(outHtml);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(converted);
        link.download = 'translated_document.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 4. Цэвэрлэх функц
    function _clearFields() {
        document.getElementById('in').innerHTML = '';
        document.getElementById('out').innerHTML = '';
        document.getElementById('wordFile').value = '';
        document.getElementById('file-status').innerText = "Source Word Document";

        const dlBtn = document.getElementById('download-btn');
        dlBtn.disabled = true;
        dlBtn.style.background = "#475569";
        dlBtn.style.cursor = "not-allowed";
    }

    // HTML-ээс дуудах холбоосуудыг Глобал цонхонд бүртгэх
    window.handleFileLoad = _handleFileLoad;
    window.startTranslation = _startTranslation;
    window.downloadWordResult = _downloadWordResult;
    window.clearFields = _clearFields;
})();
