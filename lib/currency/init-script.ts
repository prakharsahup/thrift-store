import { GEO_COOKIE } from "@/lib/geo";

// Inlined in <head>: for visitors outside India, hides prices ([data-price]) until
// CurrencyProvider has swapped the server's rupees for their currency. Like the motion script, it
// can't hide them for good: the class is removed after 2.5s whatever happens.
export const currencyInitScript = `(function(){
  var m = document.cookie.match(/(?:^|; )${GEO_COOKIE}=([A-Z]{2})/);
  if (!m || m[1] === "IN") return;
  var html = document.documentElement;
  html.classList.add("currency-pending");
  setTimeout(function(){ html.classList.remove("currency-pending"); }, 2500);
})();`;
