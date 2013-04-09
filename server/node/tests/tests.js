describe("add function",function(){
	var testObj= ["item1", "item2"];
	it("should add items to the datastoreObj",function(){
		var obj = [{id:2,item:"item3"}];
		add(obj,testObj);
		expect(testObj[2]).toEqual(obj[0]);
		expect(testObj[1]).not.toEqual("taters")
		expect(testObj[1]).not.toEqual(obj[0])
	})
	it("should throw an exception if an item to add has no id property",function(){
		var obj = [{item:"item3"}];
		expect(function(){add(obj,testObj)}).toThrow();
	})
	it("should throw an exception and should not modify testobj", function(){
		testObj= ["item1", "item2"];
		var testObjCopy = testObj.slice(0);
		var obj = [{id:2,item:"item3"},{item:"blurh"}];
		expect(function(){add(obj,testObj)}).toThrow();
		expect(testObjCopy).toEqual(testObj);
	})
	it("should not throw an exception and should modify testobj", function(){
		testObj= ["item1", "item2"];
		var testObjCopy = testObj.slice(0);
		var obj = [{id:2,item:"item3"},{id:3,item:"blurh"}];
		expect(function(){add(obj,testObj)}).not.toThrow();
		expect(testObjCopy).not.toEqual(testObj);
	})
})

