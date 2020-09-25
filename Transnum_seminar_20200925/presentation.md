<h2 style="margin-bottom:0px !important"><center>RICardo</center></h2>
<h3 ><center>Commerce international aux XIX-XXe siècles
</center></h3>
<center>Comment renouveler l’histoire de la mondialisation commerciale
grâce au numérique ? <br> <i>Séminaire TransNum - Sciences Po</i><br>25 septembre 2020</center>
<br>
<center>
Béatrice Dedinger - CHSP<br>
Paul Girard [@paulanomalie](https://twitter.com/paulanomalie) - OuestWare<br>
</center>

<center style="display:flex; justify-content:center;align-items:center">
[![Centre d'Histoire de Sciences Po](img/SciencesPO_CHSP.png)<!-- .element: style="height: 80px;"-->](http://chsp.sciencespo.fr)
[![médialab, Sciences Po](img/logo-ouestware-inline.png)<!-- .element: style="height: 50px;"-->](https://ouestware.com)
</center>

---

## Le projet RICardo

**Objectifs** :
1. Construction de base historique de données commerciales bilatérales sur la période c.1800-1938
2. Renouveler l'état de nos connaissances sur la mondialisation commerciale aux 19e-20e siècles

**Méthodes** :  
Modèle de gravité puis exploration visuelle des données

---
1. Richesse et complexité des données RICardo
2. Exploration visuelle de la mondialisation commerciale 
---
## Les flux de la base RICardo
---
## <center>![mirror flows](./img/1834_1860_world_trade_flows.png)<!-- .element: style="margin:0" --></center>


---
## Les entités RICardo

---
<center>*France. Tableau décennal du commerce, 1847-1856*</center>
<center>![France. Tableau décennal du commerce, 1847-1856](./img/France_Tableau_décennal_1847-56.JPG)<!-- .element: style="width:200%;" --></center>

---

<center>*Sveriges officiela statistik. Utrikes handel och sjöfart. 1873*</center>
<center>![Sveriges officiela statistik. Utrikes handel och sjöfart. 1873](./img/Utrikes_Handel_Sweden_1864-73.PNG)<!-- .element: style="" --></center>


---
## **L’hétérogénéité des entités RICardo**
![RICentities by types](./img/RICentities_types.png)

---

## Le type 'Geopolitical entity'

---
## Entités 'part of' Spain 1834-35
![Entities part of Spain 1834-35](./img/Spain_partof_1834-35.PNG)
---
[![GeoPolHist home page](./img/GeoPolHist_home.png)](https://medialab.github.io/GeoPolHist)
---
## GeoPolHist: political status
![GPH status](./img/GPH_status_data_table.png)
---
## GeoPolHist: political status in time
![GPH status in time](./img/GPH_status_in_time_data_table.png)

---
[![GeoPolHist of Australia](./img/GeoPolHist_Australia.png)<!-- .element: style="margin-top:-50px" -->](https://medialab.github.io/GeoPolHist/#/GeoPolHist/country/900)

---
## Exploration visuelle du commerce mondial des XX-XIXe siècles
---

## L'importance de Reporting / Partner 
---
[![RICardo page reporting France](./img/RICardo_reporting_france.png)](http://ricardo.medialab.sciencespo.fr/#!/reporting/France)
---
[![RICardo page partner Afghanistan](./img/RICardo_partner_afghanistan.png)](http://ricardo.medialab.sciencespo.fr/#!/partner/afghanistan)

---
## Exploration des structures commerciales

---

## 1. Construire le réseaux des flux

*Noeud : Converger vers le niveau entité*:
- agréger les flux part of 
- désagrégation les flux groupes

*Lien : accorder les vues bilatérales*
- choisir une méthode pour réduire les doublons bilatéraux (GTAP)

<small>*Girard, Paul, et Beatrice Dedinger. RICardo World Trade Web, 1834-1938. http://spire.sciencespo.fr/hdl:/2441/6h7io1v56e8k4qtht2cuvjcfa5. Department of economic history research seminar, Lunds universitet, Lund, SE.
*</small>

---

**1834 : en bleu, les "city/part of" dont des villes espagnoles.**
![UK trade partners in 1834 before aggregation algorithm](./img/1834_UK_partners_before_agg_algo.png)

---
**1834 : Les villes espagnoles ont été agrégées à l'entité "Spain".**
![UK trade partners in 1834 after aggregation algorithm](./img/1834_UK_partners_after_agg_algo.png)

---
## 2. Contextualiser

Le réseau est un objet mathématique pratique.  
Comme toute abstraction il réduit la multitude.  
Derrière un nœud se cache de multiples réalités.  
Maintenir la complexité dans l'interprétation de ces images.

---

Garder la richesse des sources en contextualisant les entités commerçantes :
- indiquer les effets de construction
- indiquer les statuts politiques 
- prendre en compte la dimension géographique

---
**1865 : Vert = Reporting, Rouge = seulement Partner**
![1865, red reporting, green only partner](./img/1865_after_algo_Reporting_Partner.png)
---
**1865 : couleur = GPH status (voir légende)**
![1865, red reporting, green only partner](./img/1865_after_algo_GPH_status.png)

---

réseau avec positionnement géographique ?

Notes : Je n'aurai probablement pas le temps de faire ça.

---

## Effet du numérique ? 

**L'exploration visuelle comme méthode de recherche**

Un autre rapport aux données.  
Un terrain d'enquête plus qu'un seul moyen de calcul.  

<small>*Arènes, Alexandra, et Paul Girard. « Dialogue sur la visualisation ». Sciences Po médialab, 19 mars 2020, https://medialab.sciencespo.fr/actu/dialogue-sur-la-visualisation/.
*</small>

---

## Autre effet du numérique ?

**Open Science**

Mise en réseau : facilite publications et usages secondaires.  
Intérêt plus fort à créer et partager des jeux de données.

---

<section data-background-image="./img/network_1878.png">
</section>

Note:

- asymetric link weight
- inclusion links
