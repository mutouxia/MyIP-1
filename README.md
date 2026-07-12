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

Available pages:

- `/` — core IP and connectivity checks
- `/simple/` — compact legacy view
- `/cloudflare/` — Cloudflare trace split-tunnel checks
- `/settings/` — browser-local WebRTC display preference

## Info

- PChome JSONP IP API: `https://whois.pconline.com.cn/ipJson.jsp`
- ipip.net API: `https://myip.ipip.net`
- uapis.cn API: `https://uapis.cn/api/v1/network/myip`
- ip.sb API: `https://ip.sb/api/`
- ipapi.co API: `https://ipapi.co/json`
- ipbase.com API: `https://api.ipbase.com/v1/json`
- ip-moe.zerodream.net API: `https://ip-moe.zerodream.net/`
- ~~Sohu JSONP IP API: `https://pv.sohu.com/cityjson?ie=utf-8`~~
- ~~IP-API: `https://ip-api.com/json`~~
- ~~Taobao JSONP IP API: `https://www.taobao.com/help/getip.php`~~
- ~~Taobao JSONP GEO API: `http://ip.taobao.com/service/getIpInfo.php`~~

## Contributing

All kinds of contributions are welcome.

## Thanks

Based on **MyIP** © [Sukka](https://github.com/SukkaW), Commit: 38a82d05f88c40136782742661a177b46d0aaddc, Date:   Sun Nov 24 15:23:13 2019 +0800, Released under the [MIT](./LICENSE) License.

Thanks to [ihmily/ip-info-api](https://github.com/ihmily/ip-info-api) for the IP API collection and provider references.

Thanks to [ip.net.coffee](https://ip.net.coffee/) and [ip.skk.moe](https://ip.skk.moe/) for design and probe inspiration.
