---
title: "Don't Double Down: Using Spark Structured Streaming to Wrangle Growing Data"
date: 2022-07-14
tags:
  - data
  - engineering/devops
  - engineering/python
  - mentoring/tutorials
  - viz/doodles
  - economics/finance
  - articles
---
> This post was written during my time as a software engineer at M Science as a joint project with Databricks. You can view the original post [here](https://www.databricks.com/blog/2022/07/14/using-spark-structured-streaming-to-scale-your-analytics.html)

Let's say that _you_, a ✨ _humble data plumber_ ✨ of the Big Data era, have been tasked to create an analytics solution for [an online retail dataset](https://github.com/databricks/Spark-The-Definitive-Guide/blob/master/data/retail-data/all/online-retail-dataset.csv):

| InvoiceNo | StockCode | Description          | Quantity | InvoiceDate | UnitPrice  | CustomerID | Country        |
| :-------- | :-------- | :------------------- | -------: | :---------- | ---------: | :--------- | :------------- |
| 536365    | 85123A    | WHITE HANGING HEA... | 6        | 2012-01-10  | $2.55      | 17850      | United Kingdom |
| 536365    | 71053     | WHITE METAL LANTERN  | 6        | 2012-01-10  | $3.39      | 17850      | United Kingdom |
| 536365    | 84406B    | CREAM CUPID HEART... | 8        | 2012-01-10  | $2.75      | 17850      | United Kingdom |
| ...       | ...       | ...                  | ...      | ...         | ...        | ...        | ...            |

The analysis you've been asked for is simple - an aggregation of the number of dollars, units sold, and unique users for each day, and across each stock code. With just a few lines of PySpark, we can transform our raw data into a usable aggregate:

```py
import pyspark.sql.functions as F

df = spark.table("default.online_retail_data")

agg_df = (
  df
  # Group data by month, item code and country
  .groupBy(
    "InvoiceDate",
    "StockCode",
  )
  # Return aggregate totals of dollars, units sold, and unique users
  .agg(
    F.sum("UnitPrice")
      .alias("Dollars"),
    F.sum("Quantity")
      .alias("Units"),
    F.countDistinct("CustomerID")
      .alias("Users"),
  )
)

(
  agg_df.write
  .format('delta')
  .mode('overwrite')
  .saveAsTable("analytics.online_retail_aggregations")
)
```

With your new aggregated data, you can throw together a nice visualization to do... _business things_.

![[duu_metrics.jpg]]

This works - right?

An ETL process like will work great for a _static_ analysis, where you don't expect the data to ever be updated - you assume the data you have _now_ is going to be the only data you _ever_ have. The problem with a static analysis?

Modern data doesn't stop growing.

  What are you going to do when you get _more_ data?

  The naive answer would be to just run that same code every day, but then you'd be re-processing _all_ of the data, _every_ time you run the code. Each new update means re-processing data you've already processed before. When your data gets big enough, you'll be doubling down on what you spend in time and compute costs.

  ![](cost_scaling_batch.jpg)
  _With a static analysis, you spend money on re-processing data you've already processed before_

  There are _very_ few modern data sources that aren't going to be updated. If you want to keep your analytics growing with the source of your data, and save yourself a fortune on compute cost, you'll need a better solution.

## What do we do when our data grows?

  In the past few years, the term "_Big_ Data" has become... _lacking_. As the sheer volume of data has grown and more of life has moved online, the era of _Big_ Data has started to become the era of "_God Help Us, It Just Won't Stop Getting Bigger_ Data." A good data source doesn't stop growing while you work, and this growth can make keeping data products up-to-date a monumental task.

  At [M Science](https://www.mscience.com), our mission is to use **alternative data** - data outside of your typical quarterly report or stock trend data sources - to analyze, refine, and predict change in the market and economy.

  Every day, our analysts and engineers face a challenge: **alternative data grows _really_ fast.** I'd even go as far to say that, if our data ever _stops_ growing, something in the economy has gone very, very wrong.

  As our data grows, our analytics solutions need to handle that growth. Not only do we need to account for growth, we also need to account for data that may come in late or out-of-order. This is a vital part of our mission - every new batch of data could be the batch that signals a dramatic change in the economy.

  To make scalable solutions to the analytics products that [M Science](https://www.mscience.com) analysts and clients depend on every day, we use **Databricks Structured Streaming**. Structured Streaming gives us the assurance that, as our data grows, our solutions will scale as well.

## Using Spark Structured Streaming

  Structured Streaming comes into play when new batches of data are being introduced into your data sources. Structured Streaming leverages [Delta Lake's ability to track changes in your data](https://databricks.com/product/delta-lake-on-databricks?utm_medium=cpc&utm_source=google&utm_campaign=14270641620&utm_offer=product_delta-lake-on-databricks&utm_content=delta&utm_term=delta%20databricks&utm_ad_group_c=CTX-Delta-Core-P&gclid=Cj0KCQjwkIGKBhCxARIsAINMioKY7YUppXgeo1abMFo6kC20pkSg8WXLFYAGiRfLuh67ERh3a1bFQEMaAnDkEALw_wcB) to determine what data is part of an update and **re-computes only the parts of your analysis that are affected by the new data.**

  It's important to re-frame how you think about _streaming data_. For many people, "streaming" means real-time data - streaming a movie, checking Twitter, checking the weather, _et cetera_. If you're an analyst, engineer, or scientist, **any data that gets updated is a stream.** The frequency of the update doesn't matter. It could be seconds, hours, days, or even months - if the data gets updated, the data is a stream. If the data is a stream, then Structured Streaming is going to save you _a lot_ of headaches.

  ![](assets/cost_scaling_streaming.jpg)
  _With **Structured Streaming**, you can avoid the cost of re-processing previous data_

Let's step back into our hypothetical - you have an aggregate analysis that you not only need to deliver _today_, but also _keep updating_ as new data rolls in. This time, we have the `DeliveryDate` column to remind us of the futility of our previous single-shot analysis:

| InvoiceNo | StockCode | Description          | Quantity | InvoiceDate | _DeliveryDate_ | UnitPrice | CustomerID | Country        |
| --------- | --------- | -------------------- | -------- | ----------- | -------------- | --------- | ---------- | -------------- |
| 536365    | 85123A    | WHITE HANGING HEA... | 6        | 2012-01-10  | **2012-01-17** | 2.55      | 17850      | United Kingdom |
| 536365    | 71053     | WHITE METAL LANTERN  | 6        | 2012-01-10  | **2012-01-15** | 3.39      | 17850      | United Kingdom |
| 536365    | 84406B    | CREAM CUPID HEART... | 8        | 2012-01-10  | **2012-01-16** | 2.75      | 17850      | United Kingdom |
| ...       | ...       | ...                  | ...      | ...         | **...**        | ...       | ...        | ...            |

Thankfully, the interface for Structured Streaming is incredibly similar to your original PySpark snippet. Here is your original static batch analysis code:

```py
# =================================
# ===== OLD STATIC BATCH CODE =====
# =================================

import pyspark.sql.functions as F

df = spark.table("default.online_retail_data")

agg_df = (
  df

  # Group data by date & item code
  .groupBy(
    "InvoiceDate",
    "StockCode",
  )

  # Return aggregate totals of dollars, units sold, and unique users
  .agg(
    F.sum("UnitPrice")
      .alias("Dollars"),
    F.sum("Quantity")
      .alias("Units"),
    F.countDistinct("CustomerID")
      .alias("Users"),
  )
)

(
  agg_df.write
  .format('delta')
  .mode('overwrite')
  .saveAsTable("analytics.online_retail_aggregations")
)
```

With just a few tweaks, we can adjust this to leverage Structured Streaming. To convert your previous code, you'll:

1. Read our input table as a **stream** instead of a static batch of data
2. Make a directory in your file system where **checkpoints** will be stored
3. Set a **watermark** to establish a boundary for how late data can arrive before it is ignored in the analysis
4. Modify some of your transformations to keep the saved checkpoint state from getting too large
5. Write your final analysis table as a stream that incrementally processes the input data

We'll apply these tweaks, run through each change, and give you a few options for how to configure the behavior of your stream.

Here is the ✨ _stream-ified_ ✨ version of your old code:

```diff
# =========================================
# ===== NEW STRUCTURED STREAMING CODE =====
# =========================================

+ CHECKPOINT_DIRECTORY = "/delta/checkpoints/online_retail_analysis"
+ dbutils.fs.mkdirs(CHECKPOINT_DIRECTORY)

+ df = spark.readStream.table("default.online_retail_data")

agg_df = (
  df
+ # Watermark data with an InvoiceDate of -7 days
+ .withWatermark("InvoiceDate", f"7 days")

  # Group data by date & item code
  .groupBy(
    "InvoiceDate",
    "StockCode",
  )

  # Return aggregate totals of dollars, units sold, and unique users
  .agg(
    F.sum("UnitPrice")
    .alias("Dollars"),
    F.sum("Quantity")
    .alias("Units"),
+   F.approx_count_distinct("CustomerID", 0.05)
    .alias("Users"),
  )
)

(
+ agg_df.writeStream
  .format("delta")
+ .outputMode("update")
+ .trigger(once = True)
+ .option("checkpointLocation", CHECKPOINT_DIR)
+ .toTable("analytics.online_retail_aggregations")
)
```

Let's run through each of the tweaks we made to get Structured Streaming working:

1. [**Stream from a Delta Table**](https://docs.databricks.com/delta/delta-streaming.html#delta-table-as-a-source)

```diff
+ df = spark.readStream.table("default.online_retail_data")
```

   Of all of Delta tables' nifty features, this may be the niftiest: **you can treat them like a stream**. Because [Delta keeps track of updates](https://docs.databricks.com/delta/delta-streaming.html#delta-table-as-a-source), you can use `.readStream.table()` to stream new updates each time you run the process.

   It's important to note that your input table **must** be a Delta table for this to work. It's possible to stream other data formats with different methods, but `.readStream.table()` **requires** a Delta table

2. [**Declare a checkpoint location**](https://spark.apache.org/docs/latest/streaming-programming-guide.html#checkpointing)

```diff
+ # Create checkpoint directory
+ CHECKPOINT_DIRECTORY = "/delta/checkpoints/online_retail_analysis"
+ dbutils.fs.mkdirs(CHECKPOINT_DIRECTORY)
```

   In Structured Streaming-jargon, the aggregation in this analysis is a [stateful transformation](https://spark.apache.org/docs/latest/streaming-programming-guide.html#checkpointing). Without getting too far in the weeds, Structured Streaming saves out the state of the aggregation as a **checkpoint** every time the analysis is updated.

   This is what saves you a fortune in compute cost: instead of re-processing _all_ the data from scratch every time, updates simply pick up where the last update left off.

3. [**Define a watermark**](https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html#handling-late-data-and-watermarking)

```diff
+ # Watermark data with an InvoiceDate of -7 days
+ .withWatermark("InvoiceDate", f"7 days")
```

   When you get new data, there's a good chance that you may receive data out-of-order. **Watermarking** your data lets you define a cutoff for how far back aggregates can be updated. In a sense, **it creates a boundary between "live" and "settled" data.**

   To illustrate: let's say this data product contains data up to the 7th of the month. We've set our watermark to 7 days. This means **aggregates from the 7th to the 1st are still "live"**. New updates could change aggregates from the 1st to the 7th, but any new data that lagged behind more than 7 days won't be included in the update - **aggregates prior to the 1st are "settled"**, and updates for that period are ignored.

   ![](assets/settled_live_data.jpg)
   _New data that falls outside of the watermark is not incorporated into the analysis._

   It's important to note that the column you use to watermark must be either a Timestamp or a Window.

4. [**Use Structured Streaming-compatible transformations**](https://docs.databricks.com/delta/delta-streaming.html#delta-table-as-a-sink)

```diff
+ F.approx_count_distinct("CustomerID", 0.05)
```

   In order to keep your checkpoint states from ballooning, you may need to replace some of your transformations with more storage-efficient alternatives. For a column that may contain lots of unique individual values, the [`approx_count_distinct`](https://spark.apache.org/docs/3.1.1/api/python/reference/api/pyspark.sql.functions.approx_count_distinct.html) function will get you results within a defined relative standard deviation.

5. [**Create the output stream**](https://docs.databricks.com/delta/delta-streaming.html#delta-table-as-a-sink)

```diff
+ agg_df.writeStream
   .format("delta")
+   .outputMode("update")
+   .trigger(once = True)
+   .option("checkpointLocation", CHECKPOINT_DIR)
+   .toTable("analytics.online_retail_aggregations")
```

   The final step is to output the analysis into a Delta table. With this comes a few options that determine how your stream will behave:

   - `.outputMode("update")` configures the stream so that, each time the code runs, the aggregation will pick up where it left off instead of running from scratch. To re-do an aggregation from scratch, you can use `"complete"` - in effect, doing a traditional batch aggregate while still preserving the aggregation state for a future `"update"` run.
   - `trigger(once = True)` will trigger the query once when the line of output code is started, and then stop the query once all of the new data has been processed.
   - `"checkpointLocation"` lets the program know where checkpoints should be stored.

   These configuration options make the stream behave most closely like the original one-shot solution.

This all comes together to create a scalable solution to your growing data. If new data is added to your source, your analysis will take into account the new data without costing an arm and a leg.

You'd be hard pressed to find any context where data isn't going to be updated at some point. It's a soft agreement that data analysts, engineers, and scientists make when we work with modern data - it's going to grow, and we have to find ways to handle that growth.

With Spark Structured Streaming, we can use the latest and greatest data to deliver the best products, without the headaches that come with scale.
