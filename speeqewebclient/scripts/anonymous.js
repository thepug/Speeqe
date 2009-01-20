/*
  Copyright 2007-2008 Nathan Zorn OGG, LLC
  See LICENSE.txt 
*/
Speeqe.NAMES = ["obama",
	        "bush",
		"cheney",
		"ford",
		"nixon",
		"reagan",
		"clinton",
		"carter",
		"washington",
		"taft",
		"madison",
		"anonymous",
		"coward",
		"lurker",
		"lincoln",
		"adams",
		"jefferson",
		"monroe",
		"quincyadams",
		"jackson",
		"vanburen",
		"harrison",
		"tyler",
		"polk",
		"taylor",
		"fillmore",
		"pierce",
		"buchanan",
		"johnson",
		"grant",
		"hayes",
		"garfield",
		"arthur",
		"cleveland",
		"mckinley",
		"roosevelt",
		"wilson",
		"harding",
		"coolidge",
		"hoover",
		"truman",
		"eisenhower",
		"kennedy"	     
		];

Speeqe.random =  function(num) {
    return Math.floor(Math.random() * num)+1;
};
    

Speeqe.generate_anonymous_nick = function() {
    //pick a nice name for anonymous users

    var nick = Speeqe.NAMES[Speeqe.random(Speeqe.NAMES.length)-1];
    var random_num = Speeqe.random(65535);
    var ret_array = [nick,random_num];
    
    return ret_array.join("");
    
};
