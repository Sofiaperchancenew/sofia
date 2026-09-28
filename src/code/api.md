# Sofia dans ton code — l'API

Ce document explique comment appeler **Sofia** depuis *tes propres* scripts et
programmes, en temps réel, et où sont les limites. Il complète
`src/code/integration.md` (la méthode générale : HTML décrit, CSS habille,
JavaScript agit).

L'API est `window.SofiaAPI`, écrite dans l'`index.html`, version **1.0**.

---

## 1. Ce que c'est, ce que ce n'est pas

**C'est** un appel de fonction, dans la page de Sofia :

```js
const reponse = await SofiaAPI.ask("Explique-moi les boucles for en Java.");
```

**Chaque appel passe par la même porte que le chat** : `App.Core.generateText`,
donc ton fournisseur si tu en as configuré un (Réglages → « ta propre clé API »),
sinon le moteur de Perchance — et le même verrou d'accès (`SofiaGate`). Si
l'accès est verrouillé, `ask()` refuse : l'API ne contourne pas le verrou.

**Ce n'est pas un serveur public.** Personne, depuis Internet, ne peut appeler ta
page. Il y a trois portes, de la plus simple à la plus ambitieuse :

| Porte | Depuis | Comment |
| --- | --- | --- |
| 1 | la console ou un `<script>` de la même page | `SofiaAPI.ask(...)` |
| 2 | **une autre page**, la tienne, avec un `<iframe>` | `postMessage` |
| 3 | **ton programme** (Python, Node, …) sur ta machine | pont local `127.0.0.1` |

Et une quatrième, pour les programmes qui parlent déjà à un modèle :
`SofiaAPI.persona()` te rend **son prompt système exact**, à donner à ton propre
SDK pour que ton programme parle avec *elle*.

---

## 2. Porte 1 — dans la page (ou la console intégrée)

**Le plus court : la console intégrée.** Réglages → carte **« Console (SofiaAPI) »**.
Tu y écris une question, elle répond ; tu y écris une ligne de JavaScript, elle
s'exécute. La case « Garder le fil entre les questions » fait durer la
conversation d'un essai à l'autre. Ça marche aussi sur téléphone, sans aucun outil
de développement. Depuis ton code, cette carte s'ouvre avec `SofiaAPI.console()`.

**Sinon, la console du navigateur** (F12 ou `Ctrl+Maj+J`) ou un `<script>` de ton
cru. Attention au piège : la page de Sofia vit dans un **cadre**. Dans l'onglet
« Console », choisis le contexte de ce cadre (petit menu en haut à gauche, à côté
de `top`) — c'est là que `SofiaAPI` existe. Si tu lis `undefined`, tu es sur la
mauvaise page.

Rien à installer :

```js
// Une réponse, en une ligne
const t = await SofiaAPI.ask("Quelle est la différence entre let et var en JavaScript ?");
console.log(t);
```

En streaming (la réponse s'écrit au fur et à mesure — c'est ce qu'il faut pour
une interface) :

```js
const zone = document.getElementById("maZone");
await SofiaAPI.ask("Raconte-moi comment fonctionne un routeur, en cinq phrases.", {
  onChunk: (morceau, tout) => { zone.textContent = tout; }
});
```

Avec **tes** instructions au lieu des siennes (là elle est un outil, pas une
compagne ; le ton et le rôle sont à toi) :

```js
const json = await SofiaAPI.ask("Donne-moi la recette de la pâte à crêpes en JSON strict.", {
  system: "Tu réponds uniquement par du JSON valide, sans texte autour.",
  maxTokens: 500
});
```

**Elle travaille sur ton fichier** (c'est le cœur de « l'intégration ») :

```js
const patch = await SofiaAPI.code(
  "Ajoute un bouton qui vide la liste, et branche-le sur la fonction déjà présente.",
  { file: "panier.js", code: sourceActuelle }
);
const nouveau = SofiaAPI.stripFences(patch);   // enlève le ``` autour
// nouveau = la même fonction, avec la modification.
```

Continuité entre les appels, sans toucher aux conversations de l'utilisateur :

```js
await SofiaAPI.ask("Mon projet s'appelle Zed.", { key: "mon-projet" });
await SofiaAPI.ask("Comment s'appelle mon projet ?", { key: "mon-projet" });
// -> « Ton projet s'appelle Zed. »
SofiaAPI.thread("mon-projet");   // ce que ce fil retient
SofiaAPI.forget("mon-projet");   // l'oublier
```

Suivre ce qui se passe, sans `await` :

```js
SofiaAPI.on("chunk", (d) => console.log("...", d.text));
SofiaAPI.on("done",  (d) => console.log("fini", d.tag, d.text.length));
SofiaAPI.on("error", (d) => console.error(d.error));
```

Et pour voir tout de suite que ça marche :

```js
await SofiaAPI.demo();   // une question courte, la réponse dans la console
SofiaAPI.help();         // la liste des méthodes
SofiaAPI.status();       // {ready, locked, external, provider, model, session, messages}
```

---

## 3. Porte 2 — depuis une autre page (`<iframe>` + `postMessage`)

La page de Sofia peut vivre dans un cadre, chez toi, et **ta** page lui parle.
Le cadre et ton script ne sont pas sur le même domaine : c'est `postMessage` qui
fait le pont (c'est prévu pour ça, il n'y a rien à ouvrir).

```html
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Mon outil avec Sofia</title></head>
<body>
  <button id="b">Demander</button>
  <pre id="out"></pre>

  <iframe id="sofia" src="https://null.perchance.org/s-o-f-i-a"
          style="width:100%;height:520px;border:0"></iframe>

  <script>
    const frame = document.getElementById("sofia");
    const attente = new Map();
    let seq = 0;

    window.addEventListener("message", (e) => {
      const d = e.data;
      if (!d || d.api !== "sofia") return;          // ce n'est pas elle
      const w = attente.get(d.id);
      if (!w) return;
      if (d.type === "sofia:chunk") w.onChunk && w.onChunk(d.text, d.sofar);
      if (d.type === "sofia:done")  { attente.delete(d.id); w.resolve(d.text); }
      if (d.type === "sofia:error") { attente.delete(d.id); w.reject(new Error(d.error)); }
    });

    function sofia(texte, opts = {}) {
      const id = "q" + (++seq);
      return new Promise((resolve, reject) => {
        attente.set(id, { resolve, reject, onChunk: opts.onChunk });
        frame.contentWindow.postMessage({ type: "sofia:ask", id, texte, ...opts }, "*");
      });
    }

    document.getElementById("b").onclick = async () => {
      const out = document.getElementById("out");
      const t = await sofia("Écris une fonction Python qui inverse une chaîne.", {
        onChunk: (c, tout) => { out.textContent = tout; }
      });
      console.log(t);
    };
  </script>
</body>
</html>
```

Messages acceptés par le cadre :

| Envoi (ta page) | Réponse (Sofia) |
| --- | --- |
| `{type:"sofia:ping", id}` | `{type:"sofia:pong", id, status}` |
| `{type:"sofia:ask", id, text, system?, fresh?, raw?, lang?, temperature?, maxTokens?}` | `{type:"sofia:chunk", id, text, sofar}` puis `{type:"sofia:done", id, text}` — ou `{type:"sofia:error", id, error}` |

Si tu veux fermer la porte aux autres : dans la console de Sofia,
`SofiaAPI.trusted = ["https://mon-site.fr"]` — toute autre origine n'obtient plus
de réponse (`SofiaAPI.trusted = null` pour tout rouvrir).

---

## 4. Porte 3 — depuis ton programme (Python, Node, …)

Un programme ne peut pas appeler une page. Alors **c'est ton programme qui est le
serveur**, et la page de Sofia vient y chercher le travail : elle interroge
`GET /next` (toutes les 0,9 s) et dépose le résultat dans `POST /answer` (et les
morceaux intermédiaires dans `POST /chunk`). Aucun compte, aucune clé : les deux
sont sur ta machine, en `127.0.0.1`.

Côté page, une seule ligne à taper une fois (la console du navigateur) :

```js
SofiaAPI.local(true);              // http://127.0.0.1:8787 par défaut
// ou, si tu veux un autre port :
SofiaAPI.local("http://127.0.0.1:9123");
SofiaAPI.local(false);             // éteindre
```

Le réglage est retenu (localStorage) : au prochain chargement, la page se
rebranche toute seule. **Elle est éteinte par défaut** — aucune page Sofia ne
parle à ton ordinateur si tu ne l'as pas demandé.

### Le pont est déjà écrit (ne l'écris pas toi-même)

Un programme ne peut pas appeler une page, et une page ne peut pas ouvrir de porte sur
ta machine. Le pont résout les deux : **il tourne chez toi**, et l'onglet de Sofia vient y
chercher le travail. Deux fichiers prêts, rien à installer :

| Fichier | Langue | Besoin |
| --- | --- | --- |
| `src/bridge/sofia_pond.py` | Python | Python 3.8+ (bibliothèque standard seulement) |
| `src/bridge/sofia_pond.mjs` | Node | Node 18+ |

Chacun est **les deux à la fois** : le serveur, et un client `Sofia` pour ton programme.
Trois étapes :

```bash
python sofia_pond.py          # ou : node sofia_pond.mjs  — laisse la fenêtre ouverte
```

```js
SofiaAPI.local(true);          // une fois, dans l'onglet de Sofia (ou la console intégrée)
```

```python
from sofia_pond import Sofia   # depuis ton programme, dans le même dossier que le fichier
print(Sofia().ask("En une phrase : qui es-tu ?"))

for morceau in Sofia().stream("Compte jusqu'à cinq."):
    print(morceau, end="", flush=True)

# travailler sur ton fichier :
nouveau = Sofia().code("Ajoute un bouton qui vide la liste.",
                       file="panier.js", code=open("panier.js").read())
open("panier.js", "w").write(nouveau)
```

En Node, c'est la même chose : `import { Sofia } from "./sofia_pond.mjs"`.

Sans navigateur, tu peux déjà vérifier que tout est en ordre (le pont joue lui-même le
rôle de l'onglet) :

```bash
python sofia_pond.py --selftest    # 6 contrôles : ask, streaming, méthodes, OpenAI
```

### Et en langage OpenAI

Le pont parle aussi la langue de toutes les bibliothèques d'IA
(`http://127.0.0.1:8787/v1`), avec le flux (SSE) compris :

```python
from openai import OpenAI
client = OpenAI(base_url="http://127.0.0.1:8787/v1", api_key="local")
r = client.chat.completions.create(model="sofia@mon-projet", messages=[
    {"role": "user", "content": "Qui es-tu ?"}])
print(r.choices[0].message.content)
```

Le fil mémorisé se met dans le nom du modèle : `sofia@mon-projet` garde la mémoire des
appels précédents, `sofia` tout court n'en a pas. Ça marche donc dans VS Code
(Continue, Cline), Obsidian, LangChain… sans réécrire une ligne.

### Le protocole, en trois lignes

Si tu veux ton propre serveur, c'est tout ce que l'onglet demande :

| Point | Qui appelle | Quoi |
| --- | --- | --- |
| `GET /next` | l'onglet | `{id, text, opts, key}` — ou `{}` s'il n'y a rien à faire |
| `POST /chunk` | l'onglet | `{id, text}` — un morceau de la réponse, au fil de l'eau |
| `POST /answer` | l'onglet | `{id, text}` ou `{id, error}` — la réponse finale |

Le pont retient `GET /next` jusqu'à 20 s (attente longue) : l'onglet reçoit le travail
**sans attendre** son battement de 0,9 s. `opts` accepte les mêmes clés que `ask()` :
`system`, `key`, `maxTokens`, `temperature`, `fresh`, `raw`, `lang` — plus `method`.

### Ce que l'onglet sait faire pour toi (depuis la Runde 203)

Le pont ne sait pas seulement poser des questions : `method` choisit le travail, donc
**tout ce que la console intégrée sait faire, ton programme le sait aussi** :

| `method` | Ce que tu obtiens | Côté Python / Node |
| --- | --- | --- |
| `ask` (défaut) | une réponse (son prompt, sa mémoire, son fil) | `s.ask(...)` |
| `code` | ton fichier modifié, prêt à coller | `s.code(tâche, file=…, code=…)` |
| `persona` | son prompt système exact (~88 000 caractères) | `s.persona()` |
| `history` | les derniers messages du chat en cours | `s.history(10)` |

Le mode d'emploi complet — options, sécurité, dépannage en tableau, limites honnêtes —
est **`src/bridge/README.md`**.

## 5. Pour un autre SDK : `persona()`

Si ton programme parle déjà à un modèle (ton serveur, ton Ollama, ton propre
code), tu peux lui donner **le prompt exact de Sofia** au lieu de réécrire un
personnage :

```js
const prompt = await SofiaAPI.persona();   // ~88 000 caractères
console.log(prompt);                        // copie-le dans ton programme
// ou, depuis un programme : Sofia().persona() (voir §4).
```

C'est un texte (parfois un tableau `[texte, image]` quand une image est en jeu).
Avec ton SDK :

```js
const r = await tonClient.chat.completions.create({
  model: "ton-modele",
  messages: [{ role: "system", content: prompt }, { role: "user", content: "Bonjour." }]
});
```

Note honnête : `persona()` décrit *qui elle est* et *comment elle parle*. Ce
qu'elle a de plus dans la page — lire tes fichiers, vérifier une source, colorer
ce qu'elle cite, se souvenir — se trouve dans `app`/`src`, pas dans ce texte.

---

## 6. Référence complète

| Membre | Rôle |
| --- | --- |
| `SofiaAPI.ready` | `true` si le moteur répond et que l'accès est déverrouillé |
| `SofiaAPI.status()` | `{api, ready, locked, external, provider, model, language, session, messages, trusted}` |
| `SofiaAPI.ask(text, opts)` | sa réponse (texte). `opts` : `system`, `onChunk(c, tout)`, `fresh`, `key`, `session`, `lang`, `temperature`, `maxTokens`, `tag`, `raw`, `keepMarkers`, `skipMemory` |
| `SofiaAPI.code(tache, opts)` | la version modifiée d'un fichier. `opts` : `file`, `code`, `explain`, plus ceux de `ask` |
| `SofiaAPI.persona(opts)` | son prompt système réel (`skipMemory` pour aller vite) |
| `SofiaAPI.history(n)` | les `n` derniers messages de la conversation en cours |
| `SofiaAPI.thread(k)` / `SofiaAPI.forget(k)` | ce qu'un fil `key` retient / l'oublier (`forget()` pour tout) |
| `SofiaAPI.on(ev, fn)` / `SofiaAPI.off(ev, fn)` | écoute `"chunk"`, `"done"`, `"error"` |
| `SofiaAPI.stripFences(texte)` | enlève le ``` autour d'un bloc de code |
| `SofiaAPI.trusted` | `null` (toutes les origines) ou `["https://mon-site.fr"]` |
| `SofiaAPI.local(true\|url\|false)` | le pont local ; sans argument : `{on, url, stats}` |
| `SofiaAPI.console()` | ouvre la carte-console intégrée (Réglages) |
| `SofiaAPI.consoleRun()` / `consoleHelp()` / `consoleClear()` | exécuter / l'aide / effacer (ce que font les boutons) |
| `SofiaAPI.help()` / `SofiaAPI.demo()` | la liste des méthodes / un appel d'essai |
| `SofiaAPI.version` | `"1.0"` |

`ask()` sans `system` utilise **son** prompt (mémoire et conversation comprises,
comme dans le chat) mais sur une **copie** : un appel venu d'un script ne modifie
jamais l'historique de l'utilisateur. Les marqueurs de contrôle
(`[SOFIA_IMAGE]`, bloc de réflexion…) sont retirés avant de te rendre le texte —
`keepMarkers: true` si tu les veux.

---

## 7. Limites et honnêteté

- **Un onglet doit être ouvert** pour les portes 1 à 3 : le modèle répond dans
  *ton* navigateur, pas sur un serveur. Sans page ouverte, il n'y a personne.
- **Le pont local n'écoute que chez toi** : `127.0.0.1`/`localhost` uniquement, et
  il est éteint par défaut. Rien ne part vers l'extérieur. Il refuse en plus les autres
  pages web (`Origin` différent de `*.perchance.org` ou localhost → `403`) ; tes outils
  locaux, eux, passent toujours. Un jeton partagé reste à faire (voir la feuille de route
  dans `src/bridge/README.md` §6).
- **Rien de secret ne peut vivre dans la page** : tout le code de Sofia est
  public. N'y mets jamais une clé privée, un jeton ou un mot de passe — ta clé
  d'API se met dans les Réglages, elle reste dans *ton* navigateur.
- **L'aide de l'éditeur (l'agent qui écrit ce projet) n'est pas appelable** depuis
  un programme : ce n'est pas un service mais un assistant dans l'éditeur, qui
  modifie les fichiers de ce générateur. Ce qui s'appelle depuis ton programme,
  c'est **Sofia** — `SofiaAPI` — et c'est fait pour ça.
- Si `ask()` refuse avec *« access locked »* : Sofia est derrière son verrou
  d'accès ; déverrouille-la, l'API ne le contourne pas.

---

## 8. Recettes courtes

```js
// Traduire un fichier de documentation
const fr = await SofiaAPI.ask("Traduis en français, même ton, même structure :\n\n" + texte, { maxTokens: 3000 });

// Relire un diff avant de le coller
const verdict = await SofiaAPI.ask("Ce code est-il correct ? Réponds par oui/non puis une phrase.\n\n" + diff, { system: "Tu es un relecteur sévère et bref." });

// Un contrôleur dans le navigateur : une boucle qui pilote la page
setInterval(async () => {
  const ordre = await SofiaAPI.ask("Un seul mot : STOP ou CONTINUE.", { system: "Réponds en un mot.", maxTokens: 5 });
  if (ordre.trim().toUpperCase() === "STOP") stopTout();
}, 30000);

// Ton propre outil, servi par elle (le pont local), en Python :
//   print(ask("Génère 10 noms de variables pour un jeu de cartes."))
```

Rappel de la méthode (`src/code/integration.md` §6) : une modification, on teste,
on garde ou on annule. L'API ne change pas ça — elle met juste Sofia dans la
boucle.

## 9. Ce qu'elle apprend toute seule (Runde 204)

Depuis la Runde 204, Sofia va d'elle-même sur le web (par défaut toutes les 30 minutes,
au plus 12 fiches par jour), lit de vraies pages, écrit une fiche et la garde. Tu peux
lire et piloter cet apprentissage depuis ton code (Porte 1, dans la page ou la console
intégrée) :

```js
App.WebLearn.status();
// { enabled: true, notes: 3, chars: 1550, busy: false, every: 30, quotaToday: 1 }

App.WebLearn.list();          // ses fiches (les plus récentes d'abord)
App.WebLearn.info();          // tout : réglages, plan (extension), journal des passes

await App.WebLearn.learnNow();                 // elle choisit le thème
await App.WebLearn.learn("climate models");    // un thème précis (recherche + lecture + fiche)

App.WebLearn.block("explique-moi l'entropie"); // le bloc qu'elle recevrait pour cette question
                                               // (chaîne vide = aucune fiche ne correspond)

await App.WebLearn.clear();   // elle oublie tout ce qu'elle a appris elle-même
```

Dans tes propres invites, laisse-la décider : si sa réponse contient
`[SOFIA_LEARN]un thème[/SOFIA_LEARN]`, l'appli recherche vraiment ce thème et garde la
fiche (le bloc n'est jamais montré à l'utilisateur). C'est son propre savoir — il vit
dans ton navigateur (IndexedDB `enya_weblearn_v1`), pas sur un serveur.
