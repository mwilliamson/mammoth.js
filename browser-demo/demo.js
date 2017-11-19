/* global mammoth, FileReader */
(function () {
  document.getElementById('document')
        .addEventListener('change', handleFileSelect, false)

  function handleFileSelect (event) {
    readFileInputEventAsArrayBuffer(event, function (arrayBuffer) {
      mammoth.convertToHtml({arrayBuffer: arrayBuffer})
                .then(displayResult)
    })
  }

  function displayResult (result) {
    document.getElementById('output').innerHTML = result.value

    const messageHtml = result.messages.map(function (message) {
      return '<li class="' + message.type + '">' + escapeHtml(message.message) + '</li>'
    }).join('')

    document.getElementById('messages').innerHTML = '<ul>' + messageHtml + '</ul>'
  }

  function readFileInputEventAsArrayBuffer (event, callback) {
    const file = event.target.files[0]

    const reader = new FileReader()

    reader.onload = function (loadEvent) {
      const arrayBuffer = loadEvent.target.result
      callback(arrayBuffer)
    }

    reader.readAsArrayBuffer(file)
  }

  function escapeHtml (value) {
    return value
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
  }
})()
