class HttpConn {
  async get(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  }

  async post(url, body) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      mode: "cors",
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return data;
  }

  async delete(url) {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      mode: "cors",
    });
    const data = await response.json();
    return data;
  }
}

export default HttpConn;
