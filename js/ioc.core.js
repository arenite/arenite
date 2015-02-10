/*!
 * JIOC JavaScript Library v0.0.1
 * https://github.com/lcavadas/jioc
 *
 * Copyright 2014, Luís Serralheiro
 */
/* global IOC:true */
// IOC is an implementation of the Sandbox and Module patterns. It was designed to,
// unlike most of the existing module libraries, not affect your code making it dependant on the module library itself.
//
// Base of the ioc sandbox object. Creates the base services in the ioc sandbox object.
//
// Using the Namespace and MVP (or MVC) patterns is strongly recommended but not mandatory.
//
// You can create further extensions to the sandbox by providing new services or overriding already imported ones.
//
// There are a few extensions included in this repository and you can read more about them <a href="extensions.html">here</a>.
//
// For more information about the mentioned patterns consult the book "Javascript Patterns"
// by Stoyan Stefanov from O'Reilly Media which discusses these patterns in detail.
//
// ## Configuration
// The documentation for the configuration is presented in the <a href="../index.html">website</a>.
IOC = function (config) {
  //### IOC.Object
  // Instance of the Sandbox is started with the <a href="ioc.object.html">IOC.Object</a> module witch gives us access to the <code>extend</code> function used.
  var ioc = new IOC.Object(ioc);
  //### IOC.Async
  // Extend the instance with the <a href="ioc.async.html">IOC.Async</a> extension providing the asynchronous tools (Latch Pattern) used by the Loader extension.
  ioc = ioc.object.extend(ioc, new IOC.Async());
  //### IOC.Url
  // Extend the instance with the <a href="ioc.url.html">IOC.Url</a> extension which provides functions for analysis of query parameters.
  ioc = ioc.object.extend(ioc, new IOC.Url());
  //### IOC.DI
  // Extend the instance with the <a href="ioc.di.html">IOC.DI</a> extension which provides
  // the injector functionality.
  ioc = ioc.object.extend(ioc, new IOC.DI(ioc));
  //### IOC.Loader
  // Extend the instance with the <a href="ioc.loader.html">IOC.Loader</a> extension which provides
  // the script and resource loading functionality to the sandbox.
  ioc = ioc.object.extend(ioc, new IOC.Loader(ioc));
  // Initialize the injector by having it read the configuration object passed into this constructor.
  ioc.di.loadConfig(config);
};