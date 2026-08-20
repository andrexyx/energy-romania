<p align="center">
  <img src="custom_components/energy_romania/brand/icon.png" width="180" alt="Energy Romania logo">
</p>

<h1 align="center">Energy Romania pentru Home Assistant</h1>

<p align="center">
  Integrare independentă pentru monitorizarea fluxurilor fizice de energie dintre<br>
  România și Ungaria, Serbia, Bulgaria, Ucraina și Republica Moldova.
</p>

<p align="center">
  <a href="https://github.com/andrexyx/energy-romania/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/andrexyx/energy-romania?style=flat-square"></a>
  <a href="https://github.com/andrexyx/energy-romania/blob/main/LICENSE"><img alt="License MIT" src="https://img.shields.io/github/license/andrexyx/energy-romania?style=flat-square"></a>
  <img alt="Home Assistant" src="https://img.shields.io/badge/Home%20Assistant-Custom%20Integration-41BDF5?style=flat-square&logo=home-assistant&logoColor=white">
</p>

## Ce ofera

- configurare completa din **Settings -> Devices & Services -> Add Integration**;
- fara token, cont sau configurare YAML;
- import, export si sold net pentru fiecare tara vecina;
- import total, export total si soldul tuturor frontierelor;
- valorile individuale ale liniilor in atributele senzorilor;
- card Lovelace cu harta animata, inregistrat automat in **Add card**;
- actualizare configurabila intre 30 si 3600 secunde;
- logo propriu pentru Home Assistant.

## Instalare prin HACS

1. Adauga ca repository custom:
   `https://github.com/andrexyx/energy-romania`
2. Categoria: **Integration**.
3. Instaleaza si reporneste Home Assistant.
4. Adauga integrarea **Energy Romania** din Devices & Services.
5. In dashboard alege **Add card -> Energy Romania Flow Map**.

Cardul si resursa JavaScript sunt inregistrate automat in modul Lovelace storage.

## Conventia valorilor

- import: energie care intra in Romania, intotdeauna valoare pozitiva;
- export: energie care iese din Romania, intotdeauna valoare pozitiva;
- sold net: pozitiv pentru import net, negativ pentru export net.

Sursa datelor: endpoint-ul public `https://www.transelectrica.ro/sen-filter`.
Proiectul nu este afiliat oficial cu Transelectrica SA.

## Licenta si contributii

Energy Romania este un proiect independent, publicat sub licența MIT și
menținut de `@andrexyx`.
