# MyIP

An alternative ip111 service

MyIP is a static network egress diagnostic page. It aggregates public IP probe
endpoints and geo databases so users can compare which exit IP is exposed when
their browser reaches different services.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run test
npm run build
```

The site is built into `dist` and can be deployed directly to GitHub Pages.

## Info

- IPIP.net API: `https://myip.ipip.net`
- PChome JSONP IP API: `https://whois.pconline.com.cn/ipJson.jsp`
- ~~Sohu JSONP IP API: `https://pv.sohu.com/cityjson?ie=utf-8`~~
- IP.SB API: `https://ip.sb/api/`
- IPAPI: `https://ipapi.co/json`
- Meo IP API: `https://ip.mcr.moe/`
- IPIFY API: `https://www.ipify.org/`
- ~~IP-API: `https://ip-api.com/json`~~
- ~~Taobao JSONP IP API: `https://www.taobao.com/help/getip.php`~~
- ~~Taobao JSONP GEO API: `http://ip.taobao.com/service/getIpInfo.php`~~

## Contributing

All kinds of contributions are welcome.

## Thanks

Based on **MyIP** © [Sukka](https://github.com/SukkaW), Commit: 38a82d05f88c40136782742661a177b46d0aaddc, Date:   Sun Nov 24 15:23:13 2019 +0800, Released under the [MIT](./LICENSE) License.
