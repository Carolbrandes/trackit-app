# Build Android (APK local / AAB para Play Store)

O erro ao rodar `npx expo run:android` **não é por falta de commit**. É porque o **Android SDK não está instalado** no Mac (ou `ANDROID_HOME` não está configurado).

Você tem duas opções: **SDK local** (Android Studio) ou **EAS Build** (build na nuvem, sem instalar o SDK).

---

## Opção 1: Build na nuvem com EAS (recomendado – não precisa do SDK)

Assim você gera o **AAB** direto, sem instalar Android Studio.

### 1. Instalar EAS CLI e fazer login

```bash
cd /Users/carolinamarquesbrandes/Documents/carol/repositorios/track-it/app
npm install -g eas-cli
eas login
```

(Crie conta em [expo.dev](https://expo.dev) se ainda não tiver.)

### 2. Configurar o projeto para EAS

```bash
cd /Users/carolinamarquesbrandes/Documents/carol/repositorios/track-it/app
eas build:configure
```

Isso cria/atualiza o `eas.json`. O perfil **production** já gera **AAB** por padrão.

### 3. Gerar o AAB para a Play Store

```bash
eas build --platform android --profile production
```

O build roda na nuvem. No final você recebe um link para **baixar o `.aab`** e subir na Google Play Console.

### 3.1. Keystore Android (primeira vez)

Na primeira vez que rodar o build, o EAS pergunta como assinar o app. Use o seguinte:

| Pergunta | O que escolher |
|----------|----------------|
| **Generate a new Android Keystore?** / **New Android keystore?** | **Y** (Yes). O EAS cria um keystore novo e guarda nos servidores deles. É o mais simples. |
| **Path to keystore** / **Would you like to upload your own?** | Se aparecer opção tipo “Generate new keystore” ou “Let EAS handle it”, escolha **gerar novo**. Se pedir *path* é porque você escolheu usar um keystore existente. |

**Resumo:** para o primeiro build, em todas as perguntas sobre keystore escolha **gerar um novo** (ou “Yes” / “Generate new keystore”). Não precisa informar path de arquivo — o EAS gera e armazena o keystore para você. Nos próximos builds ele reutiliza esse mesmo keystore automaticamente.

Se em algum momento aparecer um menu com opções como:
- **Set up a new keystore** → escolha essa.
- **Use existing** / **Upload** → só use se você já tiver um arquivo `.jks` ou `.keystore` de outro projeto.

### 4. (Opcional) Rodar no emulador / dispositivo via EAS

Para testar sem SDK local você pode usar:

- **Expo Go**: `npx expo start` e escanear o QR code no celular (para desenvolvimento).
- Ou, depois do primeiro build, **EAS Update** para distribuir atualizações OTA.

---

## Opção 2: SDK local (Android Studio)

Se quiser rodar `npx expo run:android` e gerar AAB na sua máquina:

### 1. Instalar Android Studio

- Baixe: [developer.android.com/studio](https://developer.android.com/studio)
- Instale e abra.
- No primeiro abrir: **More Actions → SDK Manager** e instale:
  - **Android SDK Platform** (ex.: API 34)
  - **Android SDK Build-Tools**
  - **Android SDK Command-line Tools**

### 2. Configurar ANDROID_HOME

No terminal (e depois no seu `~/.zshrc` para ficar permanente):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

(Se você instalou o SDK em outro lugar, use esse caminho em `ANDROID_HOME`.)

Depois:

```bash
source ~/.zshrc
```

### 3. Rodar no dispositivo/emulador

```bash
cd /Users/carolinamarquesbrandes/Documents/carol/repositorios/track-it/app
npx expo run:android
```

### 4. Gerar AAB localmente

```bash
cd /Users/carolinamarquesbrandes/Documents/carol/repositorios/track-it/app/android
./gradlew bundleRelease
```

O AAB sai em:  
`app/android/app/build/outputs/bundle/release/app-release.aab`

Para publicar na Play Store você ainda precisa **assinar** o AAB (keystore). O EAS (Opção 1) cuida disso na nuvem.

---

## Commit do que o prebuild gerou

O `npx expo prebuild` criou as pastas **android/** e **ios/** dentro de `app/`. Vale a pena commitar essas pastas (menos o que já está no `.gitignore`, como `android/build/`).

**Se o repositório Git for na raiz do track-it:**

```bash
cd /Users/carolinamarquesbrandes/Documents/carol/repositorios/track-it
git add app/android app/ios
git status   # conferir
git commit -m "chore(app): add native android/ios from expo prebuild"
git push
```

**Se o repositório Git for só dentro de `app/`:**

```bash
cd /Users/carolinamarquesbrandes/Documents/carol/repositorios/track-it/app
git add android ios
git status
git commit -m "chore: add native android/ios from expo prebuild"
git push
```

Assim o “todo processo” fica: **prebuild → commit das pastas nativas → escolher EAS ou SDK local → gerar AAB** (EAS com `eas build --platform android --profile production` ou local com `./gradlew bundleRelease` depois de configurar o SDK).
