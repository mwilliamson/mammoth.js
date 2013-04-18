(function() {
    mammoth.fileInput(
        document.getElementById("document"),
        function(result) {
            document.getElementById("output").innerHTML = result.html;
        }
    );
})();
