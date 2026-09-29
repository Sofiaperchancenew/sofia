# Intégration — comment on construit et on modifie une application web comme celle-ci

Ce document est un **cours d'intégration** : il montre, sur une vraie application
(celle-ci, une application Perchance écrite en un seul `index.html` plus des modules
`src/*.js`), comment on passe d'une idée à une fonctionnalité qui marche. Il est fait
pour être lu par un débutant motivé, et pour servir de référence quand on veut ajouter
quelque chose à cette application.

## 1. Les trois langages, à quoi sert chacun

- **HTML** — la structure. Des balises qui décrivent le contenu : `<div>` (un bloc),
  `<p>` (un paragraphe), `<button>` (un bouton), `<img>` (une image). Une page HTML est
  un arbre d'éléments. Rien n'a de style par défaut et rien ne bouge : le HTML décrit.
- **CSS** — la présentation. Un **sélecteur** désigne un élément (`#sendBtn`, `.card`,
  `button`), puis des **propriétés** le décorent : `color`, `background`, `padding`,
  `display: flex`, `position`, `border-radius`. On sépare en général structure et style :
  le HTML reste lisible, le CSS porte l'apparence et le responsive (`@media`).
- **JavaScript** — le comportement. Il lit et modifie le HTML vivant (le **DOM**),
  écoute les **évènements** (`click`, `input`, `keydown`), fait des calculs, appelle le
  réseau (`fetch`). C'est le seul des trois qui « exécute » quelque chose.

Règle de base de l'intégration : **HTML décrit, CSS habille, JS agit.** Quand quelque
chose ne marche pas, la première question est toujours : est-ce un problème de structure,
d'apparence, ou de comportement ?

## 2. Anatomie d'une application réelle

```
index.html      tout le programme dans une seule page : le HTML, le CSS, et le JS
src/*.js        les morceaux indépendants (un fichier = une responsabilité)
src/<dom>/*.json les données (cours, fiches, textes) — jamais dans le code
```

Dans le HTML, l'ordre compte :

1. le HTML de la page (l'écran de départ, les panneaux) ;
2. le CSS — dans un `<style>` ou un fichier `.css` ;
3. le JavaScript — à la fin, ou marqué `defer`, pour que le DOM existe déjà quand le
   script cherche ses éléments.

Exemple minimal, complet et fonctionnel :

```html
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Compteur</title>
<style>
  #val { font-size: 2rem; }
  button { padding: 8px 14px; }
</style></head>
<body>
  <p>Compteur : <span id="val">0</span></p>
  <button id="b">+1</button>
  <script>
    let n = 0;
    const val = document.getElementById('val');
    document.getElementById('b').addEventListener('click', () => {
      n += 1;
      val.textContent = n;          // on ne change PAS le HTML, on change le DOM
    });
  </script>
</body>
</html>
```

## 3. Les cinq gestes qui suffisent pour 90 % du travail

```js
// 1. trouver un élément
const el = document.querySelector('#monId');      // le premier qui correspond
const tous = document.querySelectorAll('.carte'); // tous

// 2. lire / écrire son contenu
el.textContent = 'nouveau texte';   // du texte (sûr)
el.innerHTML  = '<b>gras</b>';      // du HTML (danger : n'y mets jamais ce que l'utilisateur a tapé)

// 3. écouter un évènement
el.addEventListener('click', () => { /* ... */ });
input.addEventListener('input', () => { /* l'utilisateur tape */ });

// 4. créer et insérer un élément
const d = document.createElement('div');
d.className = 'carte';
d.textContent = 'bonjour';
document.body.appendChild(d);

// 5. montrer / cacher
el.hidden = true;                   // l'attribut hidden gagne toujours sur le style
```

Et pour le réseau :

```js
const r = await fetch('https://exemple.fr/data.json');   // async / await
if (!r.ok) throw new Error('HTTP ' + r.status);
const data = await r.json();
```

## 4. Structurer : les fonctions et les noms

Un débutant écrit tout au même endroit ; on progresse quand on découpe en **petites
fonctions qui font une seule chose** et qu'on les **nomme par ce qu'elles font** :

```js
function formatSize(octets) {
  if (octets < 1024) return octets + ' o';
  if (octets < 1024 * 1024) return (octets / 1024).toFixed(1) + ' Ko';
  return (octets / 1048576).toFixed(1) + ' Mo';
}
```

Un objet regroupe des fonctions liées (c'est le style de cette application) :

```js
const Panier = {
  articles: [],
  ajouter(nom) { this.articles.push(nom); },
  total() { return this.articles.length; },
  afficher() { return Panier.articles.join(', ') || '(vide)'; }
};
Panier.ajouter('pain');
console.log(Panier.afficher(), Panier.total());
```

## 5. Java : le même raisonnement, un autre langage

Java est **compilé** (on traduit tout le programme en un fichier `.class` avant de
l'exécuter) et **typé** : chaque variable annonce son type. Un programme commence par
une classe, et la machine virtuelle cherche une méthode `main`.

```java
public class Bonjour {
    public static void main(String[] args) {
        String nom = "Sofia";
        int age = 20;
        System.out.println("Bonjour " + nom + ", tu as " + age + " ans.");
    }
}
```

Les mêmes idées qu'en JavaScript, avec des mots plus stricts :

| Idée | JavaScript | Java |
| --- | --- | --- |
| variable | `let n = 3;` | `int n = 3;` |
| texte | `let s = "a";` | `String s = "a";` |
| condition | `if (n > 2) { }` | `if (n > 2) { }` |
| boucle | `for (let i = 0; i < 3; i++)` | `for (int i = 0; i < 3; i++)` |
| fonction | `function f(x) { return x*2; }` | `static int f(int x) { return x*2; }` |
| liste | `const t = [1,2];` | `int[] t = {1,2};` ou `List<Integer>` |
| afficher | `console.log(x)` | `System.out.println(x)` |
| erreur | `throw new Error("x")` | `throw new RuntimeException("x")` |

Java s'exécute avec `javac Bonjour.java` (compiler) puis `java Bonjour` (exécuter).

## 6. Méthode d'intégration d'une fonctionnalité (la démarche, pas le code)

1. **Écrire ce qu'on veut, en une phrase.** « Un bouton qui ajoute une carte. »
2. **Découper en gestes.** un bouton, un écouteur, une fonction qui crée et insère.
3. **Trouver le point d'entrée.** Où le bouton doit-il apparaître ? Quel élément existe
   déjà ? Comment le sélectionner (`id`, `class`) ?
4. **Écrire le plus petit code qui marche**, le tester tout de suite.
5. **Vérifier dans la console** (F12) : une seule erreur rouge explique souvent tout.
6. **Styliser seulement après** que ça marche — jamais avant.
7. **Découper en fichier** quand ça grandit (`src/mafonction.js`), et l'appeler.

Quand ça ne marche pas, dans l'ordre : l'élément existe-t-il ? (le script tourne-t-il
avant que le DOM existe ?) — le sélecteur est-il le bon ? — y a-t-il une erreur dans la
console ? — l'écouteur est-il bien branché sur l'évènement attendu ?

## 7. Lire du code qu'on n'a pas écrit

- Lire le **HTML** d'abord : quel écran, quels `id`.
- Chercher dans le JS le `id` en question (`id="..."` puis `getElementById`/`querySelector`).
- Suivre le fil : qui appelle cette fonction ? (une fonction est souvent appelée par
  un seul écouteur, ou par une boucle).
- Ne jamais changer dix choses d'un coup : **une** modification, on teste, on garde ou
  on annule.

C'est exactement comme ça qu'on peut prendre une grande application existante et
l'améliorer sans la casser : comprendre une petite partie, la changer, vérifier, passer
à la suivante. On n'a jamais besoin de tenir tout le programme dans sa tête.
