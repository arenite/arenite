/*global Arenite:true, describe:true, it:true, expect:true*/
describe('Arenite.AnnotationProcessor', function () {
  it("should register annotation-based instances", function () {
    var config = {};
    var processor = Arenite.AnnotationProcessor({
      config: config
    });
    processor.annotation.processAnnotations('/*@arenite-instance "annotated1";*/\n Arenite.AnnotationTest=function(){}');
    expect(config).toEqual({
      'context': {
        'instances': {
          'annotated1': {
            'namespace': 'Arenite.AnnotationTest'
          }
        }
      }
    });
  });

  it("should register annotation-based instances with arguments", function () {
    var config = {};
    var processor = Arenite.AnnotationProcessor({
      config: config
    });
    processor.annotation.processAnnotations('/*@arenite-instance "annotated1" ref:ref1, val:"ref2";*/\n Arenite.AnnotationTest=function(){}');
    expect(config).toEqual({
      'context': {
        'instances': {
          'annotated1': {
            'namespace': 'Arenite.AnnotationTest',
            args: [
              {ref: 'ref1'},
              {val: 'ref2'}
            ]
          }
        }
      }
    });
  });
  it("should register annotation-based instances with start if defined", function () {
    var config = {};
    var processor = Arenite.AnnotationProcessor({
      config: config
    });
    processor.annotation.processAnnotations('/*@arenite-instance "annotated1";\n@arenite-start "start-func";*/\n Arenite.AnnotationTest=function(){}');
    expect(config).toEqual({
      context: {
        instances: {
          annotated1: {
            namespace: 'Arenite.AnnotationTest'
          }
        }, start: [
          {
            instance: 'annotated1',
            func: 'start-func'
          }
        ]
      }
    });
  });

  it("should register annotation-based instances with start if defined with args", function () {
    var config = {};
    var processor = Arenite.AnnotationProcessor({
      config: config
    });
    processor.annotation.processAnnotations('/*@arenite-instance "annotated1";\n@arenite-start "start-func" ref:ref1, val:"val1";*/\n Arenite.AnnotationTest=function(){}');
    expect(config).toEqual({
      context: {
        instances: {
          annotated1: {
            namespace: 'Arenite.AnnotationTest'
          }
        }, start: [
          {
            instance: 'annotated1',
            func: 'start-func',
            args: [
              {ref: 'ref1'},
              {val: 'val1'}
            ]
          }
        ]
      }
    });
  });

  it("should register annotation-based instances with init if defined", function () {
    var config = {};
    var processor = Arenite.AnnotationProcessor({
      config: config
    });
    processor.annotation.processAnnotations('/*@arenite-instance "annotated1";\n@arenite-init "init-func";*/\n Arenite.AnnotationTest=function(){}');
    expect(config).toEqual({
      context: {
        instances: {
          annotated1: {
            namespace: 'Arenite.AnnotationTest',
            init: {func: 'init-func'}
          }
        }
      }
    });
  });

  it("should register annotation-based instances with init if defined with args", function () {
    var config = {};
    var processor = Arenite.AnnotationProcessor({
      config: config
    });
    processor.annotation.processAnnotations('/*@arenite-instance "annotated1";\n@arenite-init "start-func" ref:ref1, val:"val1";*/\n Arenite.AnnotationTest=function(){}');
    expect(config).toEqual({
      context: {
        instances: {
          annotated1: {
            namespace: 'Arenite.AnnotationTest',
            init:{
              func: 'start-func',
              args: [
                {ref: 'ref1'},
                {val: 'val1'}
              ]
            }
          }
        }
      }
    });
  });

  it("should register annotation-based init if instance not declared", function () {
    var config = {};
    var processor = Arenite.AnnotationProcessor({
      config: config
    });
    processor.annotation.processAnnotations('/*@arenite-init "init-func" ref:ref1, val:"val1";*/\n Arenite.AnnotationTest=function(){}');
    expect(config).toEqual({});
  });

  it("should register annotation-based start if instance not declared", function () {
    var config = {};
    var processor = Arenite.AnnotationProcessor({
      config: config
    });
    processor.annotation.processAnnotations('/*@arenite-start "start-func" ref:ref1, val:"val1";*/\n Arenite.AnnotationTest=function(){}');
    expect(config).toEqual({});
  });

});
