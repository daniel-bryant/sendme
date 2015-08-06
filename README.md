# SendMe

## Ruby/Rails versions
  
Ruby 2.1.2

Rails 4.2.1

## System dependencies

```
brew install imagemagick
```

## Postgres database

```
brew install postgresql

rake db:setup; rake db:migrate
```

## Running the test suite

```
bin/rspec
```

## Deploying to production

With awscli set up

```
eb deploy
```

## Running locally

From the root directory

```
powder link
```

The application is now available at:

[http://sendme.dev/](http://sendme.dev/)
