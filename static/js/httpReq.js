

// Class For HTTP Request
async function HTTPRequest(urlEndpoint, method, body) {
    req =await fetch(`http://192.168.100.9:5000/${urlEndpoint}`,
        {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).then(response => response.json())
        .then(data => {
            return data;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    return req;
}
