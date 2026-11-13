import { App } from './app.js';
  // Boot est une étape nommée, car le verrou d'accès peut la retenir
  // (voir le script du portail juste sous <body>) : sans clé valide, Sofia n'est
  // même pas initialisée – pas de réseau, pas de mémoire, pas d'interface.
  App.boot = async function () {
      await App.Plugins.network.init();
      await App.Core.init();
      try { if (App.Clock) App.Clock.init(); } catch (e) { console.warn('[Clock] init failed:', e); }
      try { App.Welcome.maybeShow(); } catch (e) { console.warn('[Welcome] init failed:', e); }
 // Question d'âge : seulement si l'écran d'accueil est (déjà) parti et qu'on
      // n'a encore jamais répondu.
      try { if (App.Age) App.Age.afterWelcome(); } catch (e) { console.warn('[Age] init failed:', e); }
 // Ce chargement vient-il d'une auto-mise à jour ? Alors dire maintenant
      // qu'elle est de retour – et remettre en place le brouillon, la session et la
      // position de défilement (src/selfupdate.js). Les erreurs ne doivent jamais
      // faire basculer le démarrage.
      try { if (App.SelfUpdate) await App.SelfUpdate.resume(); } catch (e) { console.warn('[SelfUpdate] resume failed:', e); }
      console.log("[System Status: 200] Memory Summary Service Reactivated. Trigger: 10 messages.");
  };
  (async () => {
      if (window.SofiaGate && window.SofiaGate.needsKey && window.SofiaGate.needsKey()) {
          console.log("[SofiaGate] locked – waiting for the access key.");
          window.__sofiaGatePending = function () {
              console.log("[SofiaGate] unlocked – booting Sofia.");
              App.boot();
          };
          return;
      }
      App.boot();
  })();



