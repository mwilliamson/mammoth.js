(function() {
    mammoth.fileInput(
        document.getElementById("document"),
        function(result) {
            document.getElementById("output").innerHTML = result.value;
            
            var messageHtml = result.messages.map(function(message) {
                return '<li class="' + message.type + '">' + escapeHtml(message.message) + "</li>";
            }).join("");
            
            document.getElementById("messages").innerHTML = "<ul>" + messageHtml + "</ul>";
        }
    );

    function escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
})();
