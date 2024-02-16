class HttpConn {
  constructor() {
    this.headers = {
      "Content-Type": "application/json",
    };
  }
  async get(url) {
    const response = await fetch(url, { headers: this.headers });

    return response;
  }

  async post(url, body) {
    const response = await fetch(url, {
      method: "POST",
      headers: this.headers,
      mode: "cors",
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return data;
  }

  async delete(url) {
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.headers,
      mode: "cors",
    });
    const data = await response.json();
    return data;
  }
}

export default HttpConn;
