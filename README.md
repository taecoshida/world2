# 🧬 Artificial Life — リアルタイム人工生命シミュレーション

自律エージェントが生態系を形成するリアルタイム人工生命シミュレーション。  
サーバー不要、ブラウザだけで完全に動作します。

## 🌐 Live Demo

GitHub Pages にデプロイ後、以下のURLで公開されます:  
`https://<your-username>.github.io/<repo-name>/`

## 🎮 遊び方

| 操作 | 説明 |
|---|---|
| 左クリック | 選択した生物をキャンバスに配置 |
| 右クリック | 捕食者を配置 |
| サイドパネル | 生物注入・速度変更・環境パラメータ調整 |

## 🧬 生態系ルール

| 生物 | 行動 |
|---|---|
| 🌿 植物 | 自動発生。動かない |
| 🐇 草食動物 | 植物を食べる。捕食者から逃げる。エネルギーで繁殖・死亡 |
| 🐺 捕食者 | 草食動物を狩る。エネルギーで繁殖・死亡 |

## 📦 GitHub Pages へのデプロイ

1. このリポジトリを GitHub にプッシュ
2. Settings → Pages → Source: **Deploy from a branch**
3. Branch: `main` / `/ (root)` を選択
4. Save → 数分後に公開

## 🛠 ローカル実行

```bash
# 任意のHTTPサーバーで配信
python3 -m http.server 3000
# → http://localhost:3000
```

## 技術

- Vanilla JavaScript (フレームワーク不使用)
- Canvas 2D API
- 静的ファイルのみ (サーバー不要)
