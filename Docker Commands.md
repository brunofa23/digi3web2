1. **Gestão de contêineres**:
   - `docker run`: Cria e inicia um contêiner am.
   - `docker start`: Inicia um contêiner parado.
   - `docker stop`: Para um contêiner em execução.
   - `docker restart`: Reinicia um contêiner.
   - `docker ps`: Lista os contêineres em execução.
   - `docker ps -a`: Lista todos os contêineres, incluindo os parados.
   - `docker rm`: Remove um ou mais contêineres.
   - `docker logs`: Exibe os logs de um contêiner em tempo real.
   - `docker exec`: Executa um comando em um contêiner em execução.

2. **Gestão de imagens**:
   - `docker pull`: Baixa uma imagem de um registro, como o Docker Hub.
   - `docker build`: Cria uma nova imagem a partir de um Dockerfile.
   - `docker images`: Lista imagens locais.
   - `docker rmi`: Remove uma imagem local.

3. **Redes**:
   - `docker network ls`: Lista as redes Docker.
   - `docker network create`: Cria uma nova rede Docker.
   - `docker network connect`: Conecta um contêiner a uma rede.
   - `docker network disconnect`: Desconecta um contêiner de uma rede.

4. **Volumes**:
   - `docker volume ls`: Lista os volumes Docker.
   - `docker volume create`: Cria um novo volume Docker.
   - `docker volume rm`: Remove um volume Docker.

5. **Gestão do Docker Compose**:
   - `docker-compose up`: Inicia os serviços definidos em um arquivo `docker-compose.yml`.
   - `docker-compose down`: Para e remove os serviços definidos em um arquivo `docker-compose.yml`.
   - `docker-compose ps`: Exibe o estado dos serviços definidos em um arquivo `docker-compose.yml`.

6. **Gestão de registro**:
   - `docker login`: Faz login em um registro de imagens, como o Docker Hub.
   - `docker logout`: Faz logout de um registro de imagens.
   - `docker push`: Envia uma imagem local para um registro de imagens.


7. **Criar um container**:
   docker run --name digi3Web -e MYSQL_ROOT_PASSWORD=Cartorio@12345 -p 3309:3306 -d mysql:8.0.28


8. **Iniciar docker**
   docker exec -it <ID_ou_nome_do_contêiner> mysql -uroot -p
   docker exec -it ce51a0ed1595 mysql -uroot -p

9. **Configurar Usuário Root Mysql para acesso externo**:
      select user, host from mysql.user
      update mysql.user set host='%' where user='root'

   



Esses são alguns dos comandos Docker mais utilizados. Você pode obter informações adicionais sobre um comando específico usando `docker <comando> --help` para ver a documentação de ajuda relacionada a esse comando.


