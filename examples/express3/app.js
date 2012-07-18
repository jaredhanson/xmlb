var express = require('express')
  , app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.use(express.logger());
});

app.get('/', function(req, res){
  res.render('index.xmlb', { name: 'Bruce Wayne', aliases: [ 'The Batman', 'The Dark Knight' ] });
});

app.listen(3000);
