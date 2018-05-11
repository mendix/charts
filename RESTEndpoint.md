# REST endpoint setup

* When retrieving data from a REST endpoint, a Data Point entity (non persistent entity) and the attribute(s) are required.

![Data Point entity](/assets/REST/data_point_entity.png)

* Create an export mapping which specifies how the entity relates to the JSON.

![Sample mapping export](/assets/REST/sample_mapping_export.png)

* Create a rest API which returns the Http response.

![REST microflow](/assets/REST/REST_microflow.png)

* Then publish the API.

![Published rest service](/assets/REST/published_rest_service.png)

For more information on publishing a rest API refer to [this.](https://docs.mendix.com/refguide/published-rest-operation?utm_source=businessmodeler&utm_medium=software&utm_campaign=modeler)
