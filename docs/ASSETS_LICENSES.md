# 美术、声音与依赖

- 地砖、墙体、门、窗、座椅、电脑、扫描仪、病床、植物、人物与行走动画：项目内 `src/world/Hospital.ts` 原创程序化像素绘制，未下载《星露谷物语》或其他游戏资源。
- 环境氛围音：`src/ui/audio.ts` 使用 Web Audio 振荡器合成，无录音采样。
- 中文字体：浏览器调用用户设备的 PingFang SC、Microsoft YaHei 或 sans-serif；不打包或分发字体文件。
- React、React DOM、Vite、TypeScript、Zustand、Phaser、Vitest：各自发行包 LICENSE 为准（主要 MIT）。Playwright：Apache-2.0。完整具体版本见 package-lock.json；依赖许可证保留在 node_modules 对应包中。
- 医学来源文件属于原出版机构，保留署名及原有权利，只作为本地可追溯教育依据，未将其重新授权为原创美术或自由素材。
- 本项目未擅自给用户的原创代码设定对外开源许可证；如要公开发布，请另行选择项目许可证并审核第三方医学文件是否适合随包分发。
