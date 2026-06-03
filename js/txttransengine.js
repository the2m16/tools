    // 1. Word файлыг уншиж HTML болгон зүүн талбарт гаргах функц
    function handleFileLoad(input) {
        const file = input.files[0];
        if (!file) return;

        document.getElementById('file-status').innerText = `Loaded: ${file.name}`;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            
            // Mammoth сан ашиглан .docx-ийг цэвэр HTML болгоно
            mammoth.convertToHtml({arrayBuffer: arrayBuffer})
                .then(function(result) {
                    document.getElementById('in').innerHTML = result.value;
                })
                .catch(function(err) {
                    alert("Үл мэдэгдэх Word файл байна: " + err);
                });
        };
        reader.readAsArrayBuffer(file);
    }

    // 2. Таны үндсэн орчуулгын логик (Engine)
    async function startTranslation() {
        const inputHtml = document.getElementById('in').innerHTML.trim();
        const target = document.getElementById('targetLang').value;
        if (!inputHtml || inputHtml === document.getElementById('in').getAttribute('placeholder')) return;

        const btn = document.getElementById('btn');
        const btnTxt = document.getElementById('btn-txt');
        const pBar = document.getElementById('progress');
        
        btn.disabled = true;
        btnTxt.innerText = "Processing...";

        // Зүүн цонхны HTML-ийг хуулбарлаж аваад түүн дээр ажиллана
        const parser = new DOMParser();
        const doc = parser.parseFromString(inputHtml, 'text/html');
        const textNodes = [];
        const walk = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
        let node;
        
        while(node = walk.nextNode()) {
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
                // Таны ашиглаж байсан Google Translate Free API хувилбар
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

        // Баруун талын талбарт орчуулагдсан HTML-ийг гаргана
        document.getElementById('out').innerHTML = doc.body.innerHTML;
        
        // Татаж авах товчлуурыг идэвхжүүлэх
        const dlBtn = document.getElementById('download-btn');
        dlBtn.disabled = false;
        dlBtn.style.background = "var(--accent)";
        dlBtn.style.cursor = "pointer";

        btn.disabled = false;
        btnTxt.innerText = "Translate Now";
        pBar.style.width = "0%";
    }

    // 3. Орчуулсан HTML-ийг буцааж .docx файл болгон татаж авах функц
    function downloadWordResult() {
        const outHtml = document.getElementById('out').innerHTML;
        if (!outHtml) return;

        // html-docx сан ашиглан хөрвүүлэлт хийнэ
        const converted = htmlDocx.asBlob(outHtml);
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(converted);
        link.download = 'translated_document.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Цэвэрлэх функц
    function clearFields() {
        document.getElementById('in').innerHTML = '';
        document.getElementById('out').innerHTML = '';
        document.getElementById('wordFile').value = '';
        document.getElementById('file-status').innerText = "Source Word Document";
        
        const dlBtn = document.getElementById('download-btn');
        dlBtn.disabled = true;
        dlBtn.style.background = "#475569";
        dlBtn.style.cursor = "not-allowed";
    }
