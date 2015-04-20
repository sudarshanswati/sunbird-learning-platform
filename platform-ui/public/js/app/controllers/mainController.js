var app = angular.module('playerApp', ['ui.router', 'readableTime', 'truncate', 'ngSanitize', 'sunburst.services', 'sunburst.directives', 'd3']);

app.config(function($stateProvider) {
    $stateProvider
    .state('learningMap', {
        url: "/learningMap/:id",
        views: {
            "contentSection": {
                templateUrl: "/templates/player/learningMap.html",
                controller: 'LearningMapController'
            },
        }
    })
});

app.service('PlayerService', ['$http', '$q', function($http, $q) {

    this.postToService = function(url, data) {
        var deferred = $q.defer();
        $http.post(url, data).success(function(resp) {
            if (!resp.error)
                deferred.resolve(resp);
            else
                deferred.reject(resp);
        });
        return deferred.promise;
    }

    this.getFromService = function(url, data) {
        var deferred = $q.defer();
        $http.get(url, data).success(function(resp) {
            if (!resp.error)
                deferred.resolve(resp);
            else
                deferred.reject(resp);
        });
        return deferred.promise;
    }

    this.getAllTaxonomies = function() {
        return this.getFromService('/private/v1/player/taxonomy');
    }

    this.getTaxonomyDefinitions = function(taxonomyId) {
        return this.getFromService('/private/v1/player/taxonomy/' + taxonomyId + '/definitions');
    }

    this.getTaxonomyGraph = function(taxonomyId) {
        return this.getFromService('/private/v1/player/taxonomy/' + taxonomyId + '/graph');
    }

    this.getConcept = function(conceptId) {
        return this.getFromService('/private/v1/player/concept/' + conceptId);
    }

    this.updateConcept = function(data) {
        return this.postToService('/private/v1/player/concept/update', data);
    }

    this.createConcept = function(data) {
        return this.postToService('/private/v1/player/concept/create', data);
    }

}]);

app.controller('PlayerController', ['$scope', '$timeout', '$rootScope', '$stateParams', '$state', 'PlayerService', '$location', '$anchorScroll', function($scope, $timeout, $rootScope, $stateParams, $state, service, $location, $anchorScroll) {

    // Structure of taxonomy is
    // taxonomyId: {
    //   name: 'Numeracy',
    //   identifier: '<id>',
    //   graph: {}
    //   definitions: {}
    // }
    $scope.taxonomies = {};
    $scope.allTaxonomies = undefined;
    $scope.selectedTaxonomyId = undefined;
    $scope.getAllTaxonomies = function() {
        service.getAllTaxonomies().then(function(data) {
            $scope.allTaxonomies = data;
            if(data.length > 0) {
                _.forEach(data, function(taxonomy) {
                    $scope.taxonomies[taxonomy.identifier] = taxonomy;
                })
                $scope.selectedTaxonomyId = data[0].identifier;
                $state.go('learningMap', {id: data[0].identifier});
            }
        }).catch(function(err) {
            console.log('Error fetching taxonomies - ', err);
        });
    }
    $scope.getAllTaxonomies();

    $scope.categories = [
        {id: 'general', label: "General", editable: true, editMode: false},
        {id: 'tags', label: "Tags", editable: true, editMode: false},
        {id: 'relations', label: "Relations", editable: true, editMode: false},
        {id: 'lifeCycle', label: "Lifecycle", editable: true, editMode: false},
        {id: 'usageMetadata', label: "Usage Metadata", editable: true, editMode: false},
        {id: 'analytics', label: "Analytics", editable: false, editMode: false},
        {id: 'audit', label: "Audit", editable: false, editMode: false},
        {id: 'comments', label: "Comments", editable: false, editMode: false}
    ]

    $scope.taxonomyObjects = [
        {id: 'concept', label: "Broad Concept"},
        {id: 'subConcept', label: "Sub Concept"},
        {id: 'microConcept', label: "Micro Concept"}
    ]

    $scope.scrolltoHref = function (id) {
        $location.hash(id);
        $anchorScroll();
    }

}]);

app.controller('LearningMapController', ['$scope', '$timeout', '$rootScope', '$stateParams', '$state', 'PlayerService', function($scope, $timeout, $rootScope, $stateParams, $state, service) {

    $scope.sbConcept = undefined, $scope.selectedConcept = undefined, $scope.unmodifiedConcept = undefined, $scope.showSunburst = true, $scope.showTree = false;
    $scope.newConcept = {
        taxonomyId: $scope.selectedTaxonomyId,
        name: undefined,
        description: undefined,
        objectType: $scope.taxonomyObjects[0],
        parent: undefined,
        errorMessages: []
    }
    $scope.selectedTaxonomy = $scope.$parent.taxonomies[$stateParams.id];
    $scope.getTaxonomyDefinitions = function(taxonomyId) {
        service.getTaxonomyDefinitions(taxonomyId).then(function(taxonomyDefs) {
            var categories = _.uniq(_.pluck(taxonomyDefs.properties, 'category'));
            var definitions = {

            }
            _.each(categories, function(category) {
                definitions[category] = _.where(taxonomyDefs.properties, {'category': category});
            })
            $scope.selectedTaxonomy.definitions = definitions;
            $scope.selectedTaxonomy.definitions.relations = taxonomyDefs.relations;
            $scope.selectedTaxonomy.definitions.systemTags = taxonomyDefs.systemTags;
        }).catch(function(err) {
            console.log('Error fetching taxonomy definitions - ', err);
        });
    }

    $scope.getTaxonomyGraph = function(taxonomyId) {
        service.getTaxonomyGraph(taxonomyId).then(function(data) {
            $scope.conceptGraph = data.paginatedGraph;
            $scope.selectedTaxonomy.graph = data.graph;
            $scope.sbConcept = data.graph;
            $scope.getConcept();
            $timeout(function() {
                loadSunburst($scope);
                registerLeftMenu();
            }, 1000);
            $scope.setTaxonomyGroups(data.graph);
        }).catch(function(err) {
            console.log('Error fetching taxnomy graph - ', err);
        });
    }

    $scope.getConcept = function() {
        service.getConcept($scope.sbConcept.conceptId).then(function(data) {
            $scope.unmodifiedConcept = angular.copy(data);
            $scope.selectedConcept = data;
            $scope.selectedConcept.metadata = _.object(_.map(data.properties, function(item) {
               return [item.propertyName, item]
            }));
            $scope.setAllCustomProperties();
            $timeout(function() {
                $rootScope.showConceptCategories = true;
            }, 1000);
        });
    }

    $scope.getTaxonomyDefinitions($stateParams.id);
    $scope.getTaxonomyGraph($stateParams.id);

    $rootScope.$on('selectConcept', function(event, args) {
        $scope.sbConcept = args.concept;
        $scope.getConcept();
    });

    $scope.deleteListValue = function(pname, index, formName) {
        $scope.selectedConcept.metadata[pname].value.splice(index, 1);
        $('form[name="'+formName+'"]').removeClass('ng-pristine').addClass('ng-dirty');
    }

    $scope.addListValue = function(pname) {
        if(!$scope.selectedConcept.metadata[pname].value) $scope.selectedConcept.metadata[pname].value = [];
        $scope.selectedConcept.metadata[pname].value.push("");
    }

    $scope.setAllCustomProperties = function() {
        _.each($scope.categories, function(cat) {
            $scope.setCustomProperties(cat);
        });
    }

    $scope.setCustomProperties = function(cat) {
        var props = $scope.selectedTaxonomy.definitions[cat.id];
        var propNames = _.pluck(props, 'propertyName');
        var conceptMetadata = _.where($scope.selectedConcept.properties, {'category': cat.id});
        var concptPropNames = _.pluck(conceptMetadata, 'propertyName');
        var diff = _.difference(concptPropNames, propNames);
        _.each(diff, function(propName) {
            var prop = _.where($scope.selectedConcept.properties, {'propertyName': propName})[0];
            props.push({
                propertyName: propName,
                title: prop.title,
                category: prop.category,
                dataType: 'Text',
                range:[],
                required: false,
                displayProperty: 'Editable',
                defaultValue: '',
                renderingHints: {
                    inputType: 'text'
                }
            });
        });
    }

    $scope.addNew = function(cat) {
        cat.newMetadataName = undefined;
        cat.newMetadataValue = undefined;
        cat.newTagType = 'system';
        cat.newTagValue = undefined;
        cat.addNew = true;
    }

    $scope.getSystemTags = function() {
        if(!$scope.selectedConcept.tags || $scope.selectedConcept.tags.length == 0) {
            return $scope.selectedTaxonomy.definitions.systemTags;
        }

        var stags = _.filter($scope.selectedTaxonomy.definitions.systemTags, function(tag) {
            return ($scope.selectedConcept.tags.indexOf(tag.name) == -1);
        });
        return stags;
    }

    $scope.addNewTag = function(cat) {
        if(!$scope.selectedConcept.tags) $scope.selectedConcept.tags = [];
        $scope.selectedConcept.tags.push(
            cat.newTagValue.name
        );
        cat.addNew = false;
    }

    $scope.deleteTag = function(tags, index) {
        tags.splice(index, 1);
        $('form[name="tagsForm"]').removeClass('ng-pristine').addClass('ng-dirty');
    }

    $scope.addNewMetadata = function(cat) {
        var metadataName = S(cat.newMetadataName.toLowerCase()).camelize().s;
        $scope.selectedConcept.properties.push({
            "propertyName": metadataName,
            "title": cat.newMetadataName,
            "description": "",
            "category": cat.id,
            "value": cat.newMetadataValue
        });
        $scope.selectedConcept.metadata[metadataName] = {
            "propertyName": metadataName,
            "title": cat.newMetadataName,
            "description": "",
            "category": cat.id,
            "value": cat.newMetadataValue
        }
        cat.addNew = false;
        $scope.setCustomProperties(cat);
    }

    $scope.validateConcept = function() {

        var errors = [], valid = true;
        _.each($scope.categories, function(cat) {
            _.each($scope.selectedTaxonomy.definitions[cat.id], function(prop) {
                var metadataProp = $scope.selectedConcept.metadata[prop.propertyName];
                var valueExists = false;
                prop.error = false;
                if(prop.required) { // Required Validations
                    var valueExists = true;
                    if(!metadataProp || _.isEmpty(metadataProp.value)) {
                        valueExists = false;
                        prop.error = true;
                        errors.push(prop.title + ' is required.');
                        valid = false;
                        cat.editMode = true;
                    }
                }
                if(valueExists && prop.dataType == 'Number' && metadataProp && !_.isFinite(metadataProp.value)) {
                    prop.error = true;
                    errors.push(prop.title + ' is Number and should contain only numeric value.');
                    valid = false;
                    cat.editMode = true;
                }
            });
        });
        $scope.validationMessages = errors;
        return valid;
    }

    $scope.conceptToBeUpdated = undefined;
    $scope.confirmChanges = function() {

        if(!$scope.validateConcept()) {
            return;
        }

        $scope.conceptToBeUpdated = {
            taxonomyId: $scope.selectedTaxonomyId,
            identifier: $scope.selectedConcept.identifier,
            tags: $scope.selectedConcept.tags,
            properties: []
        }
        var index = 1;
        $scope.commitMessage = "Following are the changes made:\n";

        // Check for tag changes
        var deletedTags = _.difference($scope.unmodifiedConcept.tags, $scope.selectedConcept.tags);
        var addedTags = _.difference($scope.selectedConcept.tags, $scope.unmodifiedConcept.tags);
        if(deletedTags && deletedTags.length > 0) {
            _.each(deletedTags, function(tag) {
                $scope.commitMessage += index++ + '. "' + tag + '" tag is removed\n';
            })
        }
        if(addedTags && addedTags.length > 0) {
            _.each(addedTags, function(tag) {
                $scope.commitMessage += index++ + '. "' + tag + '" tag is added\n';
            })
        }
        // Check for property changes
        var modifiedProps = _.pluck($scope.selectedConcept.properties, 'propertyName');
        var unmodifiedProps = _.pluck($scope.unmodifiedConcept.properties, 'propertyName');
        var addedProps = _.difference(modifiedProps, unmodifiedProps);
        if(addedProps && addedProps.length > 0) {
            _.each(addedProps, function(propName) {
                var prop = _.where($scope.selectedConcept.properties, {'propertyName': propName})[0];
                $scope.commitMessage += index++ + '. New metadata "' + prop.title + '" is added\n';
                $scope.conceptToBeUpdated.properties.push(prop);
            })
        }
        _.each($scope.unmodifiedConcept.properties, function(prop) {
            var modProp = $scope.selectedConcept.metadata[prop.propertyName];
            if(_.isArray(prop.value)) {
                if(_.difference(prop.value, modProp.value).length > 0 || _.difference(modProp.value, prop.value).length > 0) {
                    $scope.commitMessage += index++ + '. Metadata "' + prop.title + '" value is updated from "' + prop.value + '" to "' + modProp.value + '"\n';
                    $scope.conceptToBeUpdated.properties.push(modProp);
                }
            } else {
                if(prop.value != modProp.value) {
                    $scope.commitMessage += index++ + '. Metadata "' + prop.title + '" value is updated from "' + prop.value + '" to "' + modProp.value + '"\n';
                    $scope.conceptToBeUpdated.properties.push(modProp);
                }
            }
        });
        $('#saveChangesModal').modal('show');
    }

    $scope.saveChanges = function() {
        service.updateConcept($scope.conceptToBeUpdated).then(function(data) {
            // Handle exceptions or show messages
        }).catch(function(err) {
            // Handle exceptions or show messages
        });
    }

    $scope.onObjectTypeChange = function() {
        console.log('newConcept.parent', $scope.newConcept.parent);
        $scope.newConcept.parent = undefined;
    }

    $scope.createConcept = function() {

        var objType = $scope.newConcept.objectType.id;
        $scope.newConcept.errorMessages = [];
        var valid = true;
        if(objType != 'concept') {
            if(_.isEmpty($scope.newConcept.parent)) {
                $scope.newConcept.errorMessages.push((objType == 'subConcept' ? 'Broad Concept' : 'Sub Concept') + ' is required');
                valid = false;
            }
        }
        if(_.isEmpty($scope.newConcept.name)) {
            $scope.newConcept.errorMessages.push('Name is required');
            valid = false;
        }
        if(!valid) {
            return;
        }
        service.createConcept($scope.newConcept).then(function(data) {
            // Handle exceptions or show messages
        }).catch(function(err) {
            // Handle exceptions or show messages
        });
    }

    $scope.allConcepts = [];
    $scope.allSubConcepts = [];
    $scope.allMicroConcepts = [];
    $scope.setTaxonomyGroups = function(graph) {
        if(graph.children && graph.children.length > 0) {
            _.each(graph.children, function(node) {
                if(node.level == 1) {
                    $scope.allConcepts.push({name: node.name, id: node.conceptId});
                }
                if(node.level == 2) {
                    $scope.allSubConcepts.push({name: node.name, id: node.conceptId});
                }
                if(node.level == 3) {
                    $scope.allMicroConcepts.push({name: node.name, id: node.conceptId});
                } else {
                    $scope.setTaxonomyGroups(node);
                }
            });
        }
    }

    $scope.selectVisualization = function(type) {
        if(type == 'tree') {
            $scope.showSunburst = false;
            $scope.showTree = true;
            setTimeout(function() {
                var cid = $scope.sbConcept ? $scope.sbConcept.conceptId : null;
                showDNDTree($scope.conceptGraph, 'treeLayout', {}, $scope, cid);
            }, 1000);
        } else {
            $scope.showSunburst = true;
            $scope.showTree = false;
            loadSunburst($scope);
        }
    }

    $scope.selectConcept = function(conceptObj) {
        $scope.sbConcept = conceptObj;
        $scope.hoveredConcept = conceptObj;
        $scope.getConcept();
    }

}]);

function loadSunburst($scope) {
    // Sunburst Code
    $scope.data;
    $scope.displayVis = false;
    $scope.currentnode;
    $scope.color;
    $scope.contentList = [];
    // Browser onresize event
    window.onresize = function() {
        $scope.$apply();
    };

    // Traverses the data tree assigning a color to each node. This is important so colors are the
    // same in all visualizations
    $scope.assignColors = function(node) {
        $scope.getColor(node);
        _.each(node.children, function(c) {
            $scope.assignColors(c);
        });
    };
    // Calculates the color via alphabetical bins on the first letter. This will become more advanced.
    $scope.getColor = function(d) {
        d.color = $scope.color(d.name);
    };
    //$scope.color = ["#87CEEB", "#007FFF", "#72A0C1", "#318CE7", "#0000FF", "#0073CF"];
    $scope.color = d3.scale.ordinal().range(["#33a02c", "#1f78b4", "#b2df8a", "#a6cee3", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#6a3d9a", "#cab2d6", "#ffff99"]);

    if ($scope.selectedTaxonomy.graph) {
        var root = $scope.selectedTaxonomy.graph;
        $scope.assignColors(root);
        $scope.data = [$scope.selectedTaxonomy.graph];
        if($scope.sbConcept) {
            $scope.conceptId = $scope.sbConcept.conceptId;
        }
    }
}

function openCreateArea(thisObj, className) {
    $("#il-Txt-Editor").slideToggle('slow');
    $(thisObj).toggleClass('fa-close');
    $(thisObj).toggleClass(className);
}