Installation steps for Data Pipeline Infrastructure
-

Sunbird Learning Platform installation is automated with ansible as configuration management tool.

```sh
devops/
  playbooks.yml
  inventory/
    sample_env/
      group_vars/
        lp.yml
      hosts
  roles/
    ansible-roles
```

Above depicts the folder structure for ansible code distribution.

All the variables which can have default values, for example **cassandra_ip_address** is dynamically derived or constant values assigned and added in to defaults.
You can override that in group_vars though.

### Components in LP

1. Database
    - Cassandra
    - Neo4j
    - ElasticSearch
    - Redis
2. Event processors
    - Kafka
    - Yarn
3. Services
    - Learning
    - Search


### Variable Description

TODO

### Installing LP

Please run following playbooks in order.

General ansible execution format is 

`ansible-playbook -i inventory/sample_env/hosts <playbook.yml>`

- lp_cassandra_provision.yml
- es_composite_search_cluster_setup.yml
- lp_learning_neo4j_provision.yml
- lp_learning_provision.yml
- lp_redis_provision.yml
- lp_search_provision.yml
- lp_cassandra_db_update.yml
- lp_learning_neo4j_deploy.yml
- lp_start_neo4j.yml
- lp_zookeeper_provision.yml
- lp_kafka_provision.yml
- lp_kafka_setup.yml
- lp_learning_deploy.yml
- lp_logstash_deploy.yml --extra-vars "remote=learningall"
- lp_search_deploy.yml
- lp_synctool_deploy.yml
- lp_logstash_deploy.yml --extra-vars "remote=searchall"
- lp_yarn_provision.yml
- lp_samza_deploy.yml
- lp_samza_telemetry_schemas.yml










