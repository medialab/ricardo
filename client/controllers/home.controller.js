"use strict";

/* Controllers */

angular.module("ricardo.controllers.home", []).controller("home", [
  "$scope",
  "blogRSS",
  function ($scope, blogRSS) {
    $scope.articles = blogRSS;

    // $scope.articles = [
    //   { url: "http://ricardo.hypotheses.org/39",
    //     title: "RICardo Workshop 2017 Report",
    //     abstract:'The first RICardo workshop was organized in Paris on 12 May 2017 to celebrate the official launching of the RICardo website on the bicentenary of David Ricardo’s Principles of Political Economy and Taxation. It gathered the members of the newly &#8230; <a href="http://ricardo.hypotheses.org/39">Lire la suite <span class="meta-nav">&#8594;</span>',
    //     day:'20',
    //     month:'nov',
    //     year:'2017'
    //   },
    //   { url: "http://ricardo.hypotheses.org/1",
    //     title: "The RICardo Project",
    //     abstract:'RICardo (Research on International Commerce) est un projet dédié au commerce entre nations sur une période allant des débuts de la Révolution industrielle à la veille de la Seconde Guerre mondiale. Il allie une base historique de données commerciales couvrant &#8230; <a href="http://ricardo.hypotheses.org/1">Lire la suite <span class="meta-nav">&#8594;</span></a>',
    //     day:'18',
    //     month:'Sep',
    //     year:'2017'
    //   }
    // ]
  },
]);
