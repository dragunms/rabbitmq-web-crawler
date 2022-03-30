import HttpClient from '@azteam/http-client';

class HttpREST {
    static async apiAuth(apiKey) {
        const client = new HttpClient({
            timeout: 20000,
        });
        const res = await client.get(`${process.env.ACCOUNT_URL}/auth/login_api/${apiKey}`);

        if (res.success) {
            return res.data;
        }
        return null;
    }

    static async refreshToken(token) {
        const client = new HttpClient();
        const res = await client.get(`${process.env.ACCOUNT_URL}/auth/refresh_token/${token}`);
        if (res.success) {
            return res.data;
        }
        return null;
    }

    static async getPreviewUser(id) {
        const client = new HttpClient();
        const res = await client.get(`${process.env.ACCOUNT_URL}/users/preview/${id}`);
        if (res.success) {
            return res.data;
        }
        return null;
    }

    /* **** */
    constructor(user = {}) {
        this.client = new HttpClient({
            headers: {
                'x-app-secret': process.env.SECRET_KEY,
                'x-app-user': JSON.stringify(user),
            },
        });
    }

    async getStorage(ip) {
        const res = await this.client.get(`${process.env.API_URL}/storages/ip/${ip}`);
        if (res.success) {
            return res.data;
        }
        return null;
    }
}

export default HttpREST;
