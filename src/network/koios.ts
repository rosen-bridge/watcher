import axios from "axios";

const URL = "https://api.koios.rest/api/v0"
const koios = axios.create({
    baseURL: URL,
    timeout: 8000,
    headers: {"Content-Type": "application/json"}
});

class koiosNetwork {
    static
}
