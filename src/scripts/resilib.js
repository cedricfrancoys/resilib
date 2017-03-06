'use strict';

var resilib = angular.module('resilib', ['ngRoute',
    // dependencies
    function() {
        console.log('resilib module init');
    }
])
.directive('categoryTree', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, element, attrs) {
            console.log('category-tree directive');
            $scope.$on('categoriesReady', function(event) {
                console.log('categoriesReady event received');
                // wait for rendering to complete
                $timeout(function() {
                    console.log('enriching categrories tree');
                    element.menu().show();
                }, 0);
            });
        }
    };
})
.directive('searchTabs', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, element, attrs) {
            console.log('search-tabs directive');
            // wait for rendering to complete
            $timeout(function() {
                element.tabs();
            }, 0);

        }
    };
})
.directive('chosenSelect', function($timeout) {
    return {
        // apply to all elements having class chosen-select
        restrict: 'C',
        link: function($scope, element, attrs) {
            console.log('chosen-select directive');
            $scope.$on('categoriesReady', function(event) {
                console.log('categoriesReady event triggered');
                // wait for rendering to complete
                $timeout(function() {                
                    element
                    .chosen({'width':'200px', 'search_contains':true, 'allow_single_deselect':true})
                    .parent().find('.chosen-drop').css({'width':element.attr('drop-width')});
                });
            });
        }
    };
})
.directive('simpleTabs', function($timeout) {
    return {
        // apply to all elements having class chosen-select
        restrict: 'C',
        link: function($scope, element, attrs) {
            console.log('simple-tabs directive');
            // wait for rendering to complete
            $timeout(function() {                
                var tab_id= '#page-1';
                element.find('ul.simpleTabsNavigation').find('li')                
                .on('click', function() {
                    $(this).parent().find('li.current').removeClass('current');	
                    $(this).addClass('current');
                    $(tab_id).hide();
                    tab_id = $(this).find('a').attr('href');
                    $(tab_id).show();
                    return false;
                });
            });
        }
    };
})
.directive('hoverZoom', function($timeout) {
    return {
        restrict: 'C',
        link: function($scope, element, attrs) {
            console.log('hoverzoom directive');
            // wait for rendering to complete
            $timeout(function() {
                // make images animated on mouse over
                element
                .hover(
                    function() { element.css('zIndex', 200).addClass('transition');     }, 
                    function() { element.css('zIndex', 100).removeClass('transition');  }
                );                 
            });                
        }
    };
})
.directive('ngSticky', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, element, attrs) {
            // wait for rendering to complete
            $scope.$on('domReady', function(event) {             
                var tabs_abs_top = element.offset().top - parseFloat(element.css('marginTop').replace(/auto/, 0));
                var tabs_rel_top = element.position().top;		
                $(window).scroll(function (event) {
                    if (($(this).scrollTop()+tabs_rel_top) >= tabs_abs_top)
                        element.addClass('fixed').css('top', tabs_rel_top+'px');
                    else
                        element.removeClass('fixed').css('top', tabs_rel_top+'px');
                }); 
            });                
        }
    };
})
.service('$dataProvider', [
    '$http',
    function($http) {
        // use a deferred object as buffer for the service
        var categoriesDeferred = {'fr': null, 'es': null, 'en': null};
        
        this.getCategories = function(lang) {
            if(!categoriesDeferred[lang]) {
                categoriesDeferred[lang] = $.Deferred();
                console.log('requesting categories for language '+lang);
                $.ajax({
                    type: 'GET',
                    url: 'data/categories.php?recurse=1&lang='+lang,
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                })
                .done(function (data) {
                    categoriesDeferred[lang].resolve(data);
                });
            }
            return categoriesDeferred[lang].promise();
        };
        
        this.getDocuments = function(criteria, recurse) {
            if(typeof recurse == 'undefined') recurse = true;
            return $http.get('data/documents.php?'+criteria+'&recurse='+recurse);
        };
        
    }    
])
.controller('mainCtrl', [
    // dependencies
    '$scope',
    '$http',
    '$timeout',
    '$dataProvider',
    '$location',
    // declarations
    function($scope, $http, $timeout, $dataProvider, $location) {
        console.log('mainCtrl controller init');
   
        //model definition
        $scope.domReady = false;
        $scope.selectedDocument = false;        
        $scope.documents = {};
        $scope.categories = {};
        $scope.pagingOptions = {
            currentPage: 1,
            resultsPerPage: 10,
            totalPages: 1,
            totalRecords: 1,
            criteria: {}
        };

        
        // explicit names of the documents languages (might differ from languages supported by the UI)
        $scope.languages = {
            'en': 'English',
            'fr': 'Français',
            'es': 'Español'
        };
        
        // info for quicksearch logos and related categories
        $scope.quickSearchItems = {
            'composting':               { category: 'food/composting', picture: 'src/img/compost.png'},                        
            'self-build':               { category: 'home/self-build', picture: 'src/img/construction_habitation.png'},            
            'compressed-earth-blocks':  { category: 'home/green-building/earth/compressed-earth-blocks', picture: 'src/img/construction_presse_a_briques.png'},
            'water-treatment':          { category: 'water/drinkable-water/treatment', picture: 'src/img/eau_filtre.png'},                
            'water-pumps':              { category: 'water/water-pumps', picture: 'src/img/eau_pompe_manuelle.png'},
            'lighting':                 { category: 'energy/lighting', picture: 'src/img/elec_eclairage.png'},
            'aerogenerator':            { category: 'energy/electricity/generators/aerogenerator', picture: 'src/img/elec_eolien.png'},
            'hydrogenerators':          { category: 'energy/electricity/generators/hydrogenerators', picture: 'src/img/elec_hydraulique.png'},
            'photovoltaic-panels':      { category: 'energy/electricity/generators/photovoltaic-panels', picture: 'src/img/elec_solaire.png'},
            'bread-ovens':              { category: 'energy/thermal-energy/ovens/bread-ovens', picture: 'src/img/nourriture_pain.png'},
            'solar-heaters':            { category: 'energy/thermal-energy/heating/solar', picture: 'src/img/therm_solaire.png'}
        };

        
        // @init
        $scope.init = true;
        $scope.ui = {};
        $scope.ui.lang;
        
        $scope.$watch('ui.lang', function() {
            $scope.ui.i18n = i18n[$scope.ui.lang];
            // request categories for building UI widgets
            $dataProvider.getCategories($scope.ui.lang)
            .done(function (categories) {
                if($scope.init) {
                    $scope.init = false;
                    // force watching for some actions
                    $scope.$apply(function() {
                        // update model
                        $scope.categories = categories;
                        $scope.categories.flat = $scope.getFlatCategories();
                        $scope.$broadcast('categoriesReady');
                        // wait for rendering to complete
                        $timeout(function() {    
                            $scope.domReady = true;
                            angular.element('#root').show();
                            $scope.$broadcast('domReady');
                        });
                        
                    });
                }
                else {
                    // update model
                    $scope.categories = categories;
                    $scope.categories.flat = $scope.getFlatCategories();
                    $scope.$broadcast('categoriesReady');
                }
            });            
        });       

        // set to default language 
        $scope.ui.lang = 'fr';
        $scope.ui.i18n = i18n[$scope.ui.lang];


// Supported URL syntax are:
// http://localhost/resilib/# (all docs)
// http://localhost/resilib/?category=water
// http://localhost/resilib/#ACF-Action-contre-la-faim_Assemblage-de-filtre-a-sable-pour-le-traitement-de-leau-a-domicile_2008_fr

        // request content for initial display 
        var documents_query, recurse = false;
        
        if(angular.isUndefined($location.search().category)) {
            // if hash is specified with no arg, display all docs
            if (location.href.indexOf("#") != -1) {
                documents_query = "limit=10";
                recurse = true;
            }
            // otherwise default is root category
            else {
                documents_query = "categories=''";
            }
        }
        else {
            documents_query = "categories="+$location.search().category;
            recurse = true;
        }
        // if hash is specified, limit initial display to the document matching the given hash as identifier
        if($location.hash().length) {
            documents_query = "id="+$location.hash();
        }
        $dataProvider.getDocuments(documents_query, recurse)
        .then(function (response) {
            $scope.documents = response.data.result;
            $scope.pagingOptions.totalRecords = response.data.total;                
            $scope.pagingOptions.totalPages = Math.ceil($scope.pagingOptions.totalRecords / $scope.pagingOptions.resultsPerPage);
        });

        
        // methods definitions
        
        /*
        * @public
        */        
        $scope.keys = function (item) { return Object.keys(item); };
        
        /*
        * @public
        */        
        $scope.min = function (a, b) { return Math.min(a, b); };
        
        /*
        * @public
        */
        $scope.getFlatCategories = function () {
            var build_flat;
            return (build_flat = function (parent, categories) {
                var result = {};
                $.each(categories, function(category_id, category) {
                    result[category_id] = {title: ((parent.length)?parent+'/':'')+category.title};
                    if(typeof category.categories != 'undefined') $.extend(result, build_flat(result[category_id].title, category.categories));
                });
                return result;
            })('', $scope.categories);
        };
        
        
        /*
        * @public
        */
        $scope.pageToFirst = function() {
            $scope.pagingOptions.currentPage = 1;
            $scope.searchDocuments($scope.pagingOptions.currentCriteria);
        };
        
        /*
        * @public
        */
        $scope.pageBackward = function() {
            --$scope.pagingOptions.currentPage;
            $scope.searchDocuments($scope.pagingOptions.currentCriteria);
        };
        
        /*
        * @public
        */
        $scope.pageForward = function() {
            ++$scope.pagingOptions.currentPage;
            $scope.searchDocuments($scope.pagingOptions.currentCriteria);
        };       
        
        /*
        * @public
        */
        $scope.pageToLast = function() {
            $scope.pagingOptions.currentPage = $scope.pagingOptions.totalPages;
            $scope.searchDocuments($scope.pagingOptions.currentCriteria);
        };
        
        /*
        * @public
        */
        $scope.cantPageBackward = function() { return ($scope.pagingOptions.currentPage <= 1); };
        
        /*
        * @public
        */        
        $scope.cantPageForward = function() { return ($scope.pagingOptions.currentPage >= $scope.pagingOptions.totalPages); };        
        
        /*
        * @public
        */        
        $scope.displayDetails = function(document_id) {
            $scope.selectedDocument = $scope.documents[document_id];
            $scope.selectedDocument.id = document_id;
            angular.element('#details_dialog')
            .dialog({
                autoOpen: true,
                modal: true,
                width: 700,
                height: 'auto',
                position: {
                    my: "center top",
                    at: "center top+15%",
                    of: window
                },
                buttons:[ 
                            {
                                text: $scope.ui.i18n['details-close'],
                                click: function() { $scope.selectedDocument = false; $(this).dialog('close'); }
                            }
                        ]
            });
        };

        /*
        * @public
        */
        $scope.updateResult = function (criteria) {
            // if no criteria is given, use form data
            if(typeof criteria == 'undefined') {
                criteria = {};
                $.each($('#search_form').serializeArray(), function(i, elem) {
                    criteria[elem.name] = elem.value;
                });
            }
            // remember current criteria
            $scope.pagingOptions.criteria = criteria;
            $scope.pagingOptions.currentPage = 1;
            $scope.searchDocuments();
        };
        
        /*
        * @private
        */
        $scope.searchDocuments = function () {
            $('#menu').menu('collapseAll', {}, true);
            $('#result').hide();
            $('#loader').show();
                        
            console.log('search documents');

            $dataProvider.getDocuments($.param($.extend({}, $scope.pagingOptions.criteria, { ui: $scope.ui.lang, start: ($scope.pagingOptions.currentPage-1)*$scope.pagingOptions.resultsPerPage, limit: $scope.pagingOptions.resultsPerPage })))
            .then(function (response) {
                $scope.documents = response.data.result;
                $scope.pagingOptions.totalRecords = response.data.total;                
                $scope.pagingOptions.totalPages = Math.ceil($scope.pagingOptions.totalRecords / $scope.pagingOptions.resultsPerPage);
                
                $('#loader').hide();
                $('#result').show();
            });
        };
        
    }
])
.config(function ($locationProvider) {
    // enable HTML5mode to disable hashbang urls
    $locationProvider.html5Mode({enabled: true, requireBase: false, rewriteLinks: false}).hashPrefix('!');
});