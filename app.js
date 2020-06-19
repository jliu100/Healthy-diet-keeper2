var unirest = require("unirest");   //for using api from RapidApi

var bodyParser = require("body-parser"),
methodOverride = require("method-override"), //override method, use in edit.ejs to update
mongoose = require("mongoose"),
express = require("express"),
app = express();

var PORT=process.env.PORT||3000;




//APP CONFIG
mongoose.connect(process.env.mongolink, { useNewUrlParser: true, useUnifiedTopology: true  }) // if find restful_blog app will get things inside this, but if not, it will create one   

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));         //use override method in app


//MONGOOSE/MODLE CONFIG
var userSchema = new mongoose.Schema({
	userName: String,
	email:String,
	passWord: String,
	weightArr: [{date:String, weight:Number}],
	date:{type: Date, default:Date},

	gender:String,
	age:Number,
	height:{foot:Number,inch:Number},
	currentWeight:Number,
	active:String,
	goalLose:Number,
	timeAchieve:Number,
	caloriesPerDay:Number,

	// foodId,data,foodName,calories
	recepies:[{breakFast:[], lunch:[],dinner:[]}]
	
});


var User= mongoose.model("User", userSchema);





//Go to log in page
app.get("/", function(req,res){
	res.render("startPage");// startPage.ejs
});

//Log in Page
app.get("/eatHealthy/login", function(req,res){
	User.find({},function(err,users){
		if(err){
			console.log("ERROR");
		}else{
			res.render("login", {users:users, checkLogin:"0"}); //login.ejs
		}
	});
});

//check whether the user enters correct password and userName when they log in
app.post("/user",function(req,res){
	var globalUser="";
	var users;
	var user;
	User.find({},function(err,users){
		if(err){
			console.log("ERROR");
		}else{
			users=users;
			users.forEach(function(el){
				if(el.userName=== req.body.userName&&el.passWord===req.body.password){
					globalUser=req.body.userName;	
					user=el;	
			} 
			});
			if(globalUser!== "")
				res.render("home",{user:user});
			else
				res.render("login",{checkLogin:"1"});	
		}
	});
		
});

//sign Up new user
app.get("/eatHealthy/signUp",function(req,res){
	res.render("signup",{userNaR:"0", EmailR:"0"});  //signup.ejs
});

//CREATE ROUTE -check whether the new user enter a repeated username and userName. if they do go back to signup page and tell them to re-enter
app.post("/home", function(req,res){
	//create user
	var an="";
	var email="";
	var user;
	var anewUser=req.body.user;
	User.find({},function(err,users){
		users.forEach(function(el){
			if(el.userName===anewUser.userName){
				an=anewUser["userName"];
			} 
			if(el.email===anewUser.email){
				email=anewUser["email"];
			} 
		});
		if(an!==""&&email!=="")
			// res.render("signup");
			res.render("signup",{userNaR:"1", EmailR:"1"});
		else if(an!=="")
			// res.render("signup");
			res.render("signup",{userNaR:"1",EmailR:"0"});
		else if(email!=="")
			// res.render("signup");
			res.render("signup",{userNaR:"0",EmailR:"1"});
		else{
			User.create(anewUser,function(err,newUser){ //req.body will take data from name="user" 
			if(err){
				res.render("signup"); // go to signup.ejs
			}else{
				var count =0;
				while(count!==7){

					var obj={breakFast:["empty"], lunch:["empty"], dinner:["empty"]};
					newUser.recepies.push(obj);
					
					count++;
				}
				newUser.save();
				newUser.recepies[0];
				res.render("home",{user:newUser});// redirect to home.ejs
			}
		});
		}		
	});		
});


//Forget passwork
app.get("/forgotPassword",function(req,res){
	res.render("forgotPass", {checkEmail:"-1"});  //forgotPass.ejs
});

app.post("/changePass", function(req,res){

	User.find({},function(err,users){
		if(err){
			console.log("ERROR");
		}else{
			var user;
			var found="n";
			users.forEach(function(el){
				if(el.email=== req.body.email){
					user=el;	
					found="y";
			} 
			});
			if(found=== "y"){
				user.passWord=req.body.changeP;
				user.save();
				res.render("forgotPass",{checkEmail:"0"});
			}
			else
				res.render("forgotPass",{checkEmail:"1"});	
		}
	});
		
});


//Go back to homePage if click homepage
app.get("/user/:id/home",function(req,res){
	User.findById(req.params.id, function(err,foundUser){
		if(err){
			res.redirect("/");
		}else{
			res.render("home",{ user:foundUser}); //go to home.ejs
		}
	});
});

//Go to weight graph
app.get("/user/:id/weightGraph",function(req,res){
	User.findById(req.params.id, function(err,foundUser){
		if(err){
			res.redirect("/");
		}else{
			res.render("weightGraph",{ user:foundUser}); //go to weightGraph.ejs
		}
	});
});

//Add weight
app.put("/users/:id/editWeight", function(req,res){
	var weight1=parseInt(req.body.weight);
    var date1=req.body.date;
	User.findById(req.params.id,function(err,foundUser){
		if(err){
			res.redirect("/check_items_in_Mongo");
		}else{
			var getData={ date:date1, weight:weight1};
			foundUser.weightArr.push(getData);

			foundUser.save();
			res.render("weightGraph",{user:foundUser});
		}
	});
});

//Delete last Weight
app.put("/users/:id/deleteWeight", function(req,res){
	User.findById(req.params.id,function(err,foundUser){
		if(err){
			res.redirect("/check_items_in_Mongo");
		}else{
			foundUser.weightArr.pop();
			foundUser.save();
			res.render("weightGraph",{user:foundUser});
		}
	});
});

//go to MyDietPlan page
app.get("/user/:id/MyDietPlan", function(req,res){
	
	User.findById(req.params.id,function(err,foundUser){
		if(err){
			res.redirect("/");
		}else{
			res.render("myRecipies", {user:foundUser});
		}
	});		
	
});

//list recipe
app.get("/user/:id/Reinfo/:day/:eatTime",function(req,res){
	User.findById(req.params.id, function(err,foundUser){
		if(err){
			res.redirect("/");
		}else{
			var day=req.params.day;
			var eatTime=req.params.eatTime;

			res.render("showMore_Selected_Reci_Info",{ user:foundUser, day:day, eatTime:eatTime}); //go to showMore_Selected_Reci_Info.ejs
		}
	});
});

// <!-- eatTime=breakfast, lunch, dinner -->
app.put("/user/:id/:day/:eatTime/deleteRecipe",function(req,res){
	User.findById(req.params.id,function(err,foundUser){
		if(err){
			res.redirect("/");
		}else{
			var eatTime=req.params.eatTime;
			var day=req.params.day;
			if(eatTime==="breakfast"){
				var len=foundUser.recepies[day].breakFast.length;
				while(len!==0){
					foundUser.recepies[day].breakFast.pop();
					len=len-1;
				}	
			}
			else if(eatTime==="lunch"){
				var len=foundUser.recepies[day].lunch.length;
				while(len!==0){
					foundUser.recepies[day].lunch.pop();
					len=len-1;
				}		
			}else{
				var len=foundUser.recepies[day].dinner.length;
				while(len!==0){
					foundUser.recepies[day].dinner.pop();
					len=len-1;
				}	
			}
			foundUser.save();
			res.render("myRecipies", {user:foundUser});
		}
	});

});

// go to recipe page and search:
app.get("/user/:id/reciSearch",function(req,res){
	User.findById(req.params.id, function(err,foundUser){
		if(err){
			res.redirect("/");
		}else{
			res.render("searchRecipies",{ user:foundUser}); //go to searchRecipies.ejs
		}
	});
});



// search the foods:
app.post("/user/:id/recipies",function(req,res){

	var ex_ingredient=req.body.ex_ingredient;
	
	
	var final_ex_ingre=ex_ingredient.replace(/,/g,"%2C");

	


	var intolerance=req.body.intolerance;

	var final_intolerance=intolerance.replace(/,/g,"%2C");
	

	var cuisine=req.body.cuisine;
	var final_cuisine =cuisine.replace(/,/g,"%2C");
	

	var mincal=req.body.mincal;
	var num=req.body.num;
	var maxcal=req.body.maxcal;
	
	var type=req.body.type1;

	User.findById(req.params.id, function(err,foundUser){
		if(err){
			res.redirect("/");

		}else{
			var req = unirest("GET", "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/complexSearch");

			console.log("mincal "+ mincal);
			console.log("exclude "+ final_intolerance);
			console.log("into "+ num);
			console.log("num "+ maxcal);
			console.log("maxcal "+ mincal);
			console.log("cuisine "+ final_cuisine);
			console.log("type"+ type);
			


			req.query({
				"minCalories": mincal,
				"excludeIngredients": final_ex_ingre,
				"intolerances": final_intolerance,
				"number": num,
				"maxCalories": maxcal,
				"cuisine": final_cuisine,
				"type": type
			});


			req.headers({
				                                                                                               													
				                                                                                                 												
				"x-rapidapi-host": process.env.xhost,                                                             
				"x-rapidapi-key": process.env.xkey                                                                   
			}); 
			
			req.end(function (result) {
				if (result.error) throw new Error(result.error);
				res.render("recipe",{ user:foundUser, data:result.body}); //go to recipe.ejs
			});

		}
	});
});

//calculate and update BMR
app.put("/user/:id/updateAndCal",function(req,res){

	User.findById(req.params.id,function(err,foundUser){
		if(err){
			res.redirect("/");
		}else{
			foundUser.age=Number(req.body.age);
			foundUser.height.foot=Number(req.body.height_ft);
			foundUser.height.inch=Number(req.body.height_in);

			foundUser.currentWeight=Number(req.body.currentWeight);
			foundUser.active=req.body.active;
			foundUser.goalLose=Number(req.body.goalLose);
			foundUser.timeAchieve=Number(req.body.timeAchieve);
			
			var heightInCM=(foundUser.height.foot*12+foundUser.height.inch)*2.54
			var BMR;
			if(foundUser.gender==="female"){
				BMR=Math.round(10*(foundUser.currentWeight/2.2)+(6.25*heightInCM)-(5*foundUser.age)-161);
			}
			else if(foundUser.gender==="male"){
				BMR=Math.round(10*(foundUser.currentWeight/2.2)+(6.25*heightInCM)-(5*foundUser.age)+5);
			}else{
				BMR=Math.round(10*(foundUser.currentWeight/2.2)+(6.25*heightInCM)-(5*foundUser.age)-100);
			}

			foundUser.caloriesPerDay=BMR;
			foundUser.save();

			res.render("check",{user:foundUser, heightA:heightInCM});
		}
	});
});


// Display full info about the food
app.get("/:food/:id/:id2",function(req,res){
	var food=req.params.food;
	var an=req.params.id;
	User.findById(req.params.id2, function(err,foundUser){
		if(err){
			res.redirect("/");
		}else{

			//get ingredients 
			var url= "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/";
			url=url+an;
			url=url+"/ingredientWidget.json";
			
			var req = unirest("GET", url);

			req.headers({
				"x-rapidapi-host": process.env.xhost,
				"x-rapidapi-key": process.env.xkey
			});


			req.end(function (result) {
				if (result.error) throw new Error(result.error);
				
				//get calories 
				var caloriesUrl="https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/";
				caloriesUrl=caloriesUrl+an;
				caloriesUrl=caloriesUrl+"/nutritionWidget.json";
				var reqCal = unirest("GET", caloriesUrl);

				reqCal.headers({
					"x-rapidapi-host": process.env.xhost,
					"x-rapidapi-key": process.env.xkey
				});


				reqCal.end(function (resultCalories) {
					if (resultCalories.error) throw new Error(resultCalories.error);

					// console.log(resultCalories.body);
					var imgURL="https://spoonacular.com/recipeImages/"+an;
					imgURL=imgURL+"-556x370.jpg";

					res.render("moreFoodInfo",{ user:foundUser, data:result.body, food_id:an, foodName:food, calories:resultCalories.body.calories, img:imgURL}); //go to user.ejs
				});
				
			});
					
		}
	});
});

//add recipe part 1
app.put("/user/:food_id/:data/:foodName/:calories/:id/addRecipies",function(req, res){
	var foodId=req.params.food_id;
	var data=req.params.data;
	var foodName=req.params.foodName;
	var calories=Number(req.params.calories);

	var addNew_Re=req.body.recipe_Add;

	User.findById(req.params.id, function(err,foundUser){
		if(err){
			res.redirect("/");
		}else{
			var day=Number(addNew_Re[1])-1;
			if(addNew_Re[3]==='B')
			{
				var len=foundUser.recepies[day].breakFast.length;
				while(len!==0){
					foundUser.recepies[day].breakFast.pop();
					len=len-1;
				}		
			}
			else if(addNew_Re[3]==='L')
			{
				var len=foundUser.recepies[day].lunch.length;
				while(len!==0){
					foundUser.recepies[day].lunch.pop();
					len=len-1;
				}		
			}
			else
			{
				var len=foundUser.recepies[day].dinner.length;
				while(len!==0){
					foundUser.recepies[day].dinner.pop();
					len=len-1;
				}	
			}
			addRecipies(addNew_Re,foodId,data,foodName,calories,foundUser);
			foundUser.save();
			res.render("myRecipies",{ user:foundUser});	
		}	
	});
	
});


//add recipe
function addRecipies(addNew_Re,foodId,data,foodName,calories,foundUser){
	var day=Number(addNew_Re[1])-1;
	
	if(addNew_Re[3]==='B')
	{
		foundUser.recepies[day].breakFast.push(foodId);
		foundUser.recepies[day].breakFast.push(data);
		foundUser.recepies[day].breakFast.push(foodName);
		foundUser.recepies[day].breakFast.push(calories);
	}
	else if(addNew_Re[3]==='L')
	{
		foundUser.recepies[day].lunch.push(foodId);
		foundUser.recepies[day].lunch.push(data);
		foundUser.recepies[day].lunch.push(foodName);
		foundUser.recepies[day].lunch.push(calories);
	}
	else
	{
		foundUser.recepies[day].dinner.push(foodId);
		foundUser.recepies[day].dinner.push(data);
		foundUser.recepies[day].dinner.push(foodName);
		foundUser.recepies[day].dinner.push(calories);		
	}
}

app.listen(PORT,function(){
	console.log("Server is running");
});