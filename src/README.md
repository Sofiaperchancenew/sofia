# Le pont local — ton programme parle à Sofia

Ce dossier contient **le chaînon qui manquait** : `SofiaAPI.local(true)` savait déjà
attendre un serveur sur `127.0.0.1:8787`, mais ce serveur n'existait pas. Il existe
maintenant — dans les deux langues, un seul fichier chacune, **sans aucune
dépendance à installer** :

| Fichier | Langage | Besoin |
| --- | --- | --- |
| `sofia_pond.py` | Python | Python 3.8+ (bibliothèque standard) |
| `sofia_pond.mjs` | Node | Node 18+ (`fetch` est intégré) |

Chaque fichier est **les deux à la fois** : le serveur que l'onglet interroge, et un
petit client (`Sofia`) pour que tu n'aies pas un deuxième fichier à écrire.

```
   ton programme                le pont                     l'onglet de Sofia
 (Python, Node, …)        http://127.0.0.1:8787        (perchance.org, ouvert)
        |                          |                              |
        |  POST /ask               |   GET /next (attente longue) |
        |------------------------->|<-----------------------------|
        |                          |   POST /chunk (morceaux)     |
        |                          |   POST /answer (la réponse)  |
        |<-------------------------|                              |
        |   la réponse, en streaming                              |
```

Le modèle répond **dans ton navigateur** (comme dans le chat, avec son verrou
d'accès et ton fournisseur si tu en as configuré un). Le pont ne fait que
transporter. Donc : **un onglet de Sofia doit rester ouvert.**

---

## 1. Démarrage (trois étapes)

1. Lance le pont dans une fenêtre et laisse-la ouverte :

   ```bash
   python sofia_pond.py
   # ou
   node sofia_pond.mjs
   ```

2. Dans l'onglet de Sofia, **une fois** (console du navigateur, ou carte
   « Console (SofiaAPI) » dans les Réglages) :

   ```js
   SofiaAPI.local(true)
   ```

   Le réglage est mémorisé : aux prochains chargements, la page se rebranche seule.
   Pour éteindre : `SofiaAPI.local(false)`.

3. Vérifie que les deux se voient :

   ```python
   from sofia_pond import Sofia
   print(Sofia().health())          # {'ok': True, 'page_seen': True, ...}
   print(Sofia().ask("En une phrase : qui es-tu ?"))
   ```

   ```js
   import { Sofia } from "./sofia_pond.mjs";
   console.log(await new Sofia().ask("En une phrase : qui es-tu ?"));
   ```

   Pas de `page_seen: true` ? L'onglet n'est pas branché : reprends l'étape 2.

**Test sans navigateur** (le pont joue lui-même le rôle de l'onglet) :

```bash
python sofia_pond.py --selftest     # 6 contrôles : ask, streaming, méthodes, OpenAI
node   sofia_pond.mjs --selftest
```

---

## 2. Le client `Sofia`

### Python

```python
from sofia_pond import Sofia

s = Sofia()                       # http://127.0.0.1:8787 par défaut
s = Sofia("http://127.0.0.1:9123")   # autre port
s = Sofia(key="mon-projet")          # fil mémorisé pour tous les appels

print(s.ask("Résume ce texte en trois puces :\n" + texte))
print(s.ask("Réponds en JSON strict.", system="Tu ne réponds qu'en JSON."))
print(s.ask("Traduis en anglais.", max_tokens=800, temperature=0.3))

for morceau in s.stream("Explique les générateurs Python, en cinq phrases."):
    print(morceau, end="", flush=True)

# travailler sur un fichier :
nouveau = s.code("Ajoute un bouton qui vide la liste.",
                 file="panier.js", code=open("panier.js").read())
open("panier.js", "w").write(nouveau)

print(s.persona()[:400])          # son prompt système exact (~88 000 caractères)
print(s.history(10))              # les 10 derniers messages du chat
```

### Node

```js
import { Sofia } from "./sofia_pond.mjs";

const s = new Sofia();                      // ou new Sofia("http://127.0.0.1:9123")
console.log(await s.ask("En une phrase : qui es-tu ?"));

for await (const morceau of s.stream("Compte jusqu'à cinq.")) process.stdout.write(morceau);

const nouveau = await s.code("Ajoute un bouton.", { file: "panier.js", code: src });
console.log((await s.persona()).slice(0, 400));
console.log(await s.history(10));
```

### Ce que le client accepte

| Argument | Effet |
| --- | --- |
| `system` | tes instructions **à la place** des siennes (elle devient un outil : pas de mémoire, pas de « moi ») |
| `key` / `thread` | nom du **fil** : ce que se disent deux appels avec la même clé est retenu (comme `SofiaAPI.ask(..., {key})`) |
| `max_tokens` / `maxTokens` | longueur maximale de la réponse (défaut 2000) |
| `temperature` | 0 = sage, 1 = libre (défaut : ton réglage) |
| `lang` | force la langue de réponse (`fr`, `en`, `de`, `es`, `it`, …) |
| `fresh` | repart d'une conversation vide |
| `raw` | envoie ton texte tel quel, sans son prompt |
| `method` | `ask` (défaut), `code`, `persona`, `history` (le client choisit tout seul) |
| `n` | avec `history` : combien de messages |
| `file`, `code`, `explain` | avec `code` : le fichier à modifier et le mot d'explication |

---

## 3. Compatible OpenAI (le pont parle la langue des bibliothèques)

Adresse de base : **`http://127.0.0.1:8787/v1`**

```python
from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:8787/v1", api_key="local")   # la clé n'est pas lue
r = client.chat.completions.create(model="sofia", messages=[
    {"role": "system", "content": "Réponds en français, brièvement."},
    {"role": "user", "content": "Qui es-tu ?"}])
print(r.choices[0].message.content)

# en streaming
for ev in client.chat.completions.create(model="sofia", stream=True, messages=[
        {"role": "user", "content": "Compte jusqu'à cinq."}]):
    print(ev.choices[0].delta.content or "", end="")
```

```js
import OpenAI from "openai";
const client = new OpenAI({ baseURL: "http://127.0.0.1:8787/v1", apiKey: "local" });
const r = await client.chat.completions.create({
  model: "sofia", messages: [{ role: "user", content: "Qui es-tu ?" }],
});
console.log(r.choices[0].message.content);
```

```bash
curl -s http://127.0.0.1:8787/v1/chat/completions -H "Content-Type: application/json" \
  -d '{"model":"sofia","messages":[{"role":"user","content":"Un mot : bonjour ?"}]}'
```

**Le fil se choisit dans le nom du modèle** : `"model": "sofia@mon-projet"` utilise le
fil `mon-projet` (mémoire des appels précédents). `"sofia"` tout court n'a pas de fil
— chaque appel est indépendant, sauf si tu réutilises le même `@nom`.

Les messages `system` sont respectés ; les tours `user`/`assistant` précédents sont
ajoutés au contexte sous forme de conversation. **Les images ne passent pas par ce
chemin** (l'API `image_url` est ignorée avec une note) : c'est une limite honnête du
protocole, qui ne transporte que du texte.

Ça marche avec tout ce qui parle OpenAI : VS Code (Continue, Cline), Obsidian,
LangChain, un notebook, ton propre client… Le modèle s'appelle `sofia`.

---

## 4. Le protocole (si tu écris ton propre serveur)

Trois points suffisent — c'est tout ce que `SofiaAPI.local(true)` demande :

| Point | Qui appelle | Quoi |
| --- | --- | --- |
| `GET /next` | l'onglet | « as-tu du travail ? » → `200` + `{id, text, opts, key}` ou `200 {}` si rien. **Le pont retient la demande jusqu'à 20 s** (attente longue) : dès qu'un travail arrive, l'onglet le reçoit sans attendre son battement. |
| `POST /chunk` | l'onglet | `{id, text}` — un morceau de la réponse en cours |
| `POST /answer` | l'onglet | `{id, text}` ou `{id, error}` — la réponse finale |

Réponses du pont pour toi :

| Point | Effet |
| --- | --- |
| `POST /ask` | `{text, system?, key?, maxTokens?, temperature?, stream?, method?, n?, file?, code?, explain?, lang?, fresh?, raw?}` → `{text, id, model}` (ou flux SSE avec `"stream": true`) |
| `POST /v1/chat/completions` | compatible OpenAI, avec `"stream": true` |
| `GET /v1/models` | la liste (un seul modèle : `sofia`) |
| `GET /health` | `{ok, page_seen, asked, answered, pending, …}` |
| `GET /` | le mode d'emploi en JSON |

Réglages du serveur : `--port` (8787), `--host` (127.0.0.1), `--hold` (20000 ms),
`--timeout` (180 s), `--quiet`, `--allow-origin URL`, `--no-origin-check`.

---

## 5. Limites (honnêtes)

- **Un onglet ouvert est obligatoire** : elle pense dans ton navigateur, pas dans ce
  fichier. Onglet fermé = plus personne.
- **Une demande à la fois.** L'onglet traite un travail, puis le suivant. Deux
  appels simultanés sont mis en file d'attente, pas exécutés ensemble.
- **Le streaming vient par morceaux** : ils traversent le navigateur, donc une
  réponse longue peut arriver par à-coups. Il n'y a pas de latence de départ (attente
  longue) et pas de perte de morceaux.
- **Une réponse plus longue que `--timeout` (180 s) est abandonnée** — augmente-le
  avec `--timeout 600` si tu fais de très longues générations.
- **Pas d'images, pas de fichiers** dans ce sens : le pont transporte du texte. Pour
  lui donner une image, passe par la page (chat, vision) et non par ce chemin.
- **La « mémoire » du pont, c'est le fil `key`** (ou `@fil` dans le modèle OpenAI) —
  c'est un fil séparé, qui ne touche jamais tes conversations dans la page.

## 6. Sécurité

- Le pont n'écoute **que chez toi** (`127.0.0.1`) et **seulement quand tu le lances**.
- Il **refuse les autres pages web** : une requête qui vient d'un autre site
  (`Origin` autre que `*.perchance.org` ou `localhost`) reçoit un `403` et l'origine
  est écrite dans le journal du pont. Tes outils locaux (Python, Node, curl)
  n'envoient pas d'`Origin` et ne sont donc jamais bloqués.
- `--no-origin-check` désactive ce contrôle (à ne faire que si tu sais pourquoi).
- **Il n'y a pas encore de jeton partagé** : tant que le pont tourne, un programme
  local peut l'appeler. C'est la prochaine étape prévue (jeton à l'ouverture +
  `SofiaAPI.local(url, {token})`).
- Ces deux fichiers sont dans `src/`, donc **publics** — ils ne contiennent aucun
  secret (et ne doivent jamais en contenir).

## 7. Dépannage

| Symptôme | Cause probable | Remède |
| --- | --- | --- |
| `Aucun onglet Sofia ne s'est annoncé` | l'onglet n'est pas ouvert, ou `SofiaAPI.local(true)` n'a pas été tapé | ouvre la page, tape la ligne une fois |
| `Le port 8787 est déjà pris` | un autre programme l'utilise | `--port 9123`, puis `SofiaAPI.local("http://127.0.0.1:9123")` |
| La réponse n'arrive pas (timeout) | l'onglet est verrouillé, occupé, ou fermé en cours de route | vérifie dans la page : `SofiaAPI.status()` |
| `403 origin_not_allowed` | une autre page web essaie de parler à ton pont | c'est le but ; `--allow-origin https://mon-site.fr` pour l'autoriser |
| `HTTP 504` | personne n'a répondu dans le délai | `--timeout 600`, et regarde ce que fait l'onglet |
| Le flux arrive d'un coup à la fin | tu regardes un client qui ne lit pas le SSE | utilise `stream()` / `stream: true` |

## 8. Journal

Le mode d'emploi côté page (les quatre portes) est `src/code/api.md` §4. Ce pont a été
construit en **Runde 203** ; l'historique complet est dans `src/docs/history.enc`
(§110 de `src/README.md`).
