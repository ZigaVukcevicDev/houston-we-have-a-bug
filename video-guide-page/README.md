# Video guide page

Landing page for the **Houston, we have a bug** extension video guide.

> **Note:** This is a demo page used for recording purposes only. It intentionally contains visual bugs to showcase the extension's annotation features. The domain `trip-to-the-moon.com` is not a real website — it only works locally via a hosts file redirect.

## Local setup

### 1. Add to hosts file

```
sudo nano /etc/hosts
```

Add:

```
127.0.0.1 trip-to-the-moon.com www.trip-to-the-moon.com
```

### 2. Generate certificates

Requires [mkcert](https://github.com/FiloSottile/mkcert). Install with `brew install mkcert` if needed.

```
mkcert -install
mkcert trip-to-the-moon.com www.trip-to-the-moon.com
```

This creates `trip-to-the-moon.com+1.pem` and `trip-to-the-moon.com+1-key.pem` (gitignored).

### 3. Serve

Run from the repo root:

```
sudo npx serve -l 443 --ssl-cert video-guide-page/trip-to-the-moon.com+1.pem --ssl-key video-guide-page/trip-to-the-moon.com+1-key.pem video-guide-page
```

Open [https://trip-to-the-moon.com](https://trip-to-the-moon.com).
